import { test, expect } from '@playwright/experimental-ct-react';
import Hello from './Hello';

test('renders default greeting', async ({ mount }) => {
  const component = await mount(<Hello />);
  await expect(component).toContainText('Hello, World!');
});

test('renders custom name', async ({ mount }) => {
  const component = await mount(<Hello name="React" />);
  await expect(component).toContainText('Hello, React!');
});


