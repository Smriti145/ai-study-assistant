import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import {
  api,
  post,
  configure,
  loadConnection,
  Solution,
  Card,
  Deck,
  DeckSummary,
  Insights,
} from './api';
import { Button, Choices, Field, styles as s } from './ui';

function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Something went wrong. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}
function ErrorText({ message }: { message: string }) {
  return message ? (
    <Text accessibilityRole="alert" style={s.error}>
      {message}
    </Text>
  ) : null;
}

export function SolverScreen() {
  const [problem, setProblem] = useState(''),
    [subject, setSubject] = useState('math');
  const [photo, setPhoto] = useState<Asset | null>(null),
    [result, setResult] = useState<Solution | null>(null),
    [reveal, setReveal] = useState(false);
  const [history, setHistory] = useState<Solution[]>([]),
    [offset, setOffset] = useState(0);
  const { busy, error, run } = useAction();
  function historyPage(next: number) {
    run(async () => {
      setHistory(await api<Solution[]>(`/problems/history?offset=${next}`));
      setOffset(next);
    });
  }
  function solve() {
    run(async () => {
      setResult(null);
      setReveal(false);
      let solved: Solution;
      if (photo?.uri) {
        const body = new FormData();
        body.append('file', {
          uri: photo.uri,
          name: photo.fileName || 'problem.jpg',
          type: photo.type || 'image/jpeg',
        } as unknown as Blob);
        body.append('subject', subject);
        solved = await api<Solution>('/problems/image', {
          method: 'POST',
          body,
        });
      } else {
        solved = await post<Solution>('/problems/solve', { problem, subject });
      }
      setResult(solved);
    });
  }
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={s.screen}
    >
      <Text style={s.title}>Problem solver</Text>
      <Text style={s.subtitle}>A hint first. Understanding follows.</Text>
      <ErrorText message={error} />
      <View style={s.panel}>
        <Choices
          values={[
            'math',
            'physics',
            'chemistry',
            'biology',
            'programming',
            'other',
          ]}
          value={subject}
          onChange={setSubject}
          disabled={busy}
        />
        <Field
          label="Your problem"
          multiline
          maxLength={20000}
          value={problem}
          onChangeText={setProblem}
          editable={!busy && !photo}
        />
        <Button
          title={photo ? 'Remove selected photo' : 'Choose a problem photo'}
          disabled={busy}
          onPress={() => {
            if (photo) {
              setPhoto(null);
              return;
            }
            run(async () => {
              const choice = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 1,
                quality: 0.9,
              });
              if (choice.errorCode)
                throw new Error(
                  choice.errorMessage || 'Could not open photo library.',
                );
              const asset = choice.assets?.[0];
              if (asset) {
                if ((asset.fileSize || 0) > 10 * 1024 * 1024)
                  throw new Error('Use a photo smaller than 10 MB.');
                setPhoto(asset);
              }
            });
          }}
        />
        {photo && (
          <Text style={s.subtitle}>
            Selected: {photo.fileName || 'Photo'}. This replaces typed input.
          </Text>
        )}
        <Button
          title={busy ? 'Working…' : 'Solve problem'}
          disabled={busy || (!photo && !problem.trim())}
          onPress={solve}
        />
      </View>
      {result && (
        <View style={s.panel}>
          <Text style={s.heading}>{result.problem}</Text>
          <Text style={s.text}>Hint: {result.hint}</Text>
          {reveal ? (
            <>
              {result.steps.map((step, i) => (
                <Text key={i} style={s.text}>
                  {i + 1}. {step}
                </Text>
              ))}
              <Text style={s.heading}>Answer: {result.answer}</Text>
              <Text style={s.text}>{result.verification}</Text>
            </>
          ) : (
            <Button title="Reveal solution" onPress={() => setReveal(true)} />
          )}
          <Text style={s.subtitle}>
            AI explanations may contain mistakes. Verify important steps.
          </Text>
        </View>
      )}
      <Text style={s.heading}>Saved solutions</Text>
      <Button
        title="Refresh history"
        disabled={busy}
        onPress={() => historyPage(0)}
      />
      {history.map(row => (
        <Button
          key={row.id}
          title={row.problem}
          disabled={busy}
          onPress={() => {
            setResult(row);
            setReveal(false);
          }}
        />
      ))}
      <Choices
        values={['Previous', 'Next']}
        value=""
        disabled={busy}
        onChange={v => {
          if (v === 'Previous' && offset > 0) historyPage(offset - 20);
          if (v === 'Next' && history.length === 20) historyPage(offset + 20);
        }}
      />
    </ScrollView>
  );
}

export function FlashcardsScreen() {
  const [title, setTitle] = useState(''),
    [notes, setNotes] = useState(''),
    [count, setCount] = useState('5');
  const [decks, setDecks] = useState<DeckSummary[]>([]),
    [deck, setDeck] = useState<Deck | null>(null),
    [reveal, setReveal] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null),
    [offset, setOffset] = useState(0);
  const { busy, error, run } = useAction();
  const card = deck?.cards.find(
    c => new Date(c.due_at).getTime() <= Date.now(),
  );
  function list(next: number) {
    run(async () => {
      setDecks(await api<DeckSummary[]>(`/flashcards/decks?offset=${next}`));
      setOffset(next);
    });
  }
  function updateCard(updated: Card) {
    setDeck(d =>
      d
        ? { ...d, cards: d.cards.map(c => (c.id === updated.id ? updated : c)) }
        : d,
    );
  }
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={s.screen}
    >
      <Text style={s.title}>Flashcards</Text>
      <Text style={s.subtitle}>Make your notes memorable.</Text>
      <ErrorText message={error} />
      <View style={s.panel}>
        <Field
          label="Deck title"
          maxLength={120}
          value={title}
          onChangeText={setTitle}
          editable={!busy}
        />
        <Field
          label="Study notes"
          multiline
          maxLength={50000}
          value={notes}
          onChangeText={setNotes}
          editable={!busy}
        />
        <Field
          label="Cards (3–20)"
          keyboardType="number-pad"
          value={count}
          onChangeText={setCount}
          editable={!busy}
        />
        <Button
          title={busy ? 'Working…' : 'Generate deck'}
          disabled={
            busy ||
            !title.trim() ||
            !notes.trim() ||
            !Number.isInteger(Number(count)) ||
            Number(count) < 3 ||
            Number(count) > 20
          }
          onPress={() =>
            run(async () => {
              setDeck(
                await post<Deck>('/flashcards/decks', {
                  title,
                  text: notes,
                  count: Number(count),
                }),
              );
              setReveal(false);
              setEditing(null);
            })
          }
        />
      </View>
      <Button title="Refresh decks" disabled={busy} onPress={() => list(0)} />
      {decks.map(d => (
        <Button
          key={d.id}
          disabled={busy}
          title={`${d.title} · ${d.due} due`}
          onPress={() =>
            run(async () => {
              setDeck(await api<Deck>(`/flashcards/decks/${d.id}`));
              setReveal(false);
              setEditing(null);
            })
          }
        />
      ))}
      <View style={s.row}>
        <Button
          title="Previous decks"
          disabled={busy || offset === 0}
          onPress={() => list(Math.max(0, offset - 50))}
        />
        <Button
          title="Next decks"
          disabled={busy || decks.length < 50}
          onPress={() => list(offset + 50)}
        />
      </View>
      {deck && (
        <View style={s.panel}>
          <Text style={s.heading}>{deck.title}</Text>
          {card ? (
            <>
              <Text style={s.heading}>{card.front}</Text>
              {reveal ? (
                <>
                  <Text style={s.text}>{card.back}</Text>
                  <Text style={s.subtitle}>How well did you recall it?</Text>
                  <Choices
                    values={['again', 'hard', 'good', 'easy']}
                    value=""
                    disabled={busy}
                    onChange={rating =>
                      run(async () => {
                        updateCard(
                          await post<Card>(
                            `/flashcards/cards/${card.id}/review`,
                            { rating, version: card.version },
                          ),
                        );
                        setReveal(false);
                      })
                    }
                  />
                </>
              ) : (
                <Button title="Reveal answer" onPress={() => setReveal(true)} />
              )}
            </>
          ) : (
            <Text style={s.text}>
              You’re caught up. Refresh and reopen this deck later.
            </Text>
          )}
          <Text style={s.subtitle}>
            AI-generated cards: review and edit their content.
          </Text>
          {deck.cards.map(c => (
            <Button
              key={c.id}
              title={`Edit: ${c.front}`}
              disabled={busy}
              onPress={() => setEditing(c)}
            />
          ))}
          {editing && (
            <>
              <Field
                label="Card question"
                multiline
                maxLength={2000}
                value={editing.front}
                onChangeText={front => setEditing({ ...editing, front })}
                editable={!busy}
              />
              <Field
                label="Card answer"
                multiline
                maxLength={4000}
                value={editing.back}
                onChangeText={back => setEditing({ ...editing, back })}
                editable={!busy}
              />
              <Button
                title="Save card"
                disabled={busy || !editing.front.trim() || !editing.back.trim()}
                onPress={() =>
                  run(async () => {
                    updateCard(
                      await api<Card>(`/flashcards/cards/${editing.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(editing),
                      }),
                    );
                    setEditing(null);
                  })
                }
              />
              <Button
                title="Cancel edit"
                disabled={busy}
                onPress={() => setEditing(null)}
              />
            </>
          )}
          <Button
            title="Delete deck"
            disabled={busy}
            onPress={() =>
              Alert.alert(
                'Delete deck?',
                'This removes its cards and review history.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () =>
                      run(async () => {
                        await api(`/flashcards/decks/${deck.id}`, {
                          method: 'DELETE',
                        });
                        setDeck(null);
                        setDecks(rows => rows.filter(d => d.id !== deck.id));
                      }),
                  },
                ],
              )
            }
          />
        </View>
      )}
    </ScrollView>
  );
}

export function ProgressScreen() {
  const [range, setRange] = useState('week'),
    [data, setData] = useState<Insights | null>(null),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api<Insights>(`/analytics?range=${range}`)
      .then(d => {
        if (active) setData(d);
      })
      .catch(e => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range, revision]);
  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Text style={s.title}>Your progress</Text>
      <Choices
        values={['week', 'month', 'semester']}
        value={range}
        onChange={setRange}
      />
      <Button
        title="Refresh progress"
        onPress={() => setRevision(x => x + 1)}
      />
      <ErrorText message={error} />
      {loading && <Text style={s.text}>Loading progress…</Text>}
      {!loading && !error && data && (
        <>
          <View style={s.panel}>
            {[
              [data.attempts, 'Practice attempts'],
              [
                data.accuracy === null ? '—' : `${data.accuracy}%`,
                'Practice accuracy',
              ],
              [data.solutions, 'Problems explored'],
              [data.reviews, 'Flashcard reviews'],
              [data.active_days, 'Active days'],
              [data.streak, 'Current streak · UTC days'],
            ].map(([value, label]) => (
              <Text key={label} style={s.heading}>
                {value} · {label}
              </Text>
            ))}
          </View>
          <View style={s.panel}>
            <Text style={s.heading}>Practice by subject</Text>
            {data.subjects.map(row => (
              <Text key={row.subject} style={s.text}>
                {row.subject}:{' '}
                {row.score === null
                  ? 'No attempts yet'
                  : `${row.score}% (${row.attempts} attempts)`}
              </Text>
            ))}
          </View>
          <View style={s.panel}>
            <Text style={s.heading}>Flashcard recall</Text>
            {Object.entries(data.review_ratings).map(([rating, n]) => (
              <Text style={s.text} key={rating}>
                {rating}: {n}
              </Text>
            ))}
            <Text style={s.subtitle}>
              Self-reported recall is separate from graded accuracy.
            </Text>
          </View>
          <Text style={s.heading}>Recent activity</Text>
          {!data.activity.length && (
            <Text style={s.text}>
              No activity yet. Solve a problem or review a card to begin.
            </Text>
          )}
          {data.activity.map((row, i) => (
            <View key={i} style={s.panel}>
              <Text style={s.text}>{row.activity}</Text>
              <Text style={s.subtitle}>
                {row.result} · {new Date(row.date).toLocaleString()}
              </Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

export function ConnectionScreen({ onSave }: { onSave: () => void }) {
  const [url, setUrl] = useState(''),
    [token, setToken] = useState(''),
    [message, setMessage] = useState('');
  const { busy, error, run } = useAction();
  useEffect(() => {
    let active = true;
    loadConnection()
      .then(value => {
        if (active) setUrl(value);
      })
      .catch(() => {
        if (active) setMessage('Enter your backend URL below.');
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={s.screen}
    >
      <Text style={s.title}>Connection</Text>
      <Text style={s.subtitle}>
        Connect to your study workspace backend. AI keys stay on the server.
      </Text>
      <ErrorText message={error} />
      <Field
        label="Backend URL (ending in /api)"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        value={url}
        onChangeText={setUrl}
      />
      <Field
        label="Access token (optional for local demo)"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={token}
        onChangeText={setToken}
      />
      <Button
        title="Save and check connection"
        disabled={busy}
        onPress={() =>
          run(async () => {
            setMessage('');
            await configure(url, token);
            onSave();
            await api('/analytics');
            setMessage('Connected. Your workspace is ready.');
          })
        }
      />
      {!!message && <Text style={s.text}>{message}</Text>}
      <Text style={s.subtitle}>
        The URL is saved on this device. The access token lasts only for this
        app session. The current backend defaults to a shared local demo
        account.
      </Text>
    </ScrollView>
  );
}
