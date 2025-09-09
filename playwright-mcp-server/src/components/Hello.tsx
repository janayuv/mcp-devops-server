import React from 'react';

type HelloProps = { name?: string };

export default function Hello({ name = 'World' }: HelloProps) {
  return (
    <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
      <h1>Hello, {name}!</h1>
      <button onClick={() => { /* noop for CT */ }}>Click me</button>
    </div>
  );
}


