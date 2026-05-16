async function test() {
  const res = await fetch('http://localhost:5001/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'essam.kushad@gmail.com' })
  });
  const text = await res.text();
  console.log('Status:', res.status, res.statusText);
  console.log('Body:', text);
}

test();
