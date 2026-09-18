import React from 'react';
import { TextInput } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import App from '../App';
import { Button } from '../src/ui';

test('solves a problem, hides the answer until reveal and opens progress', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    status: 201,
    ok: true,
    json: async () => ({
      id: 1,
      problem: '2x = 8',
      hint: 'Divide by two',
      steps: ['x = 8 / 2'],
      answer: '4',
      verification: '2 × 4 = 8',
    }),
  });
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const root = renderer.root;
  const button = (title: string) =>
    root.findAllByType(Button).find(node => node.props.title === title)!;
  await act(async () => {
    root.findByType(TextInput).props.onChangeText('2x = 8');
  });
  await act(async () => {
    button('Solve problem').props.onPress();
  });
  expect(JSON.stringify(renderer.toJSON())).toContain('Divide by two');
  expect(JSON.stringify(renderer.toJSON())).not.toContain('2 × 4 = 8');
  await act(async () => {
    button('Reveal solution').props.onPress();
  });
  expect(JSON.stringify(renderer.toJSON())).toContain('2 × 4 = 8');
  globalThis.fetch = jest.fn().mockResolvedValue({
    status: 200,
    ok: true,
    json: async () => ({
      attempts: 0,
      accuracy: null,
      solutions: 1,
      reviews: 0,
      active_days: 1,
      streak: 1,
      subjects: [],
      review_ratings: { again: 0 },
      activity: [],
    }),
  });
  await act(async () => {
    root
      .findAll(
        node =>
          node.props.accessibilityLabel === 'Progress' &&
          typeof node.props.onPress === 'function',
      )[0]
      .props.onPress();
  });
  expect(JSON.stringify(renderer.toJSON())).toContain('Problems explored');
  await act(async () => {
    renderer.unmount();
  });
});
