export default function Home() {
  return (
    <div style={{padding:20, fontFamily:'Arial'}}>
      <h1>Lark Print Service</h1>
      <p>Endpoint: <code>/api/print</code></p>
      <p>Use Lark Base webhook to POST JSON to the endpoint with header <code>x-api-key</code>.</p>
    </div>
  )
}
