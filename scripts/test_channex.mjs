const apiKey = 'YMA31Y3FaAfYttZt47YT8YawygB8NhPy2cjnylxNDuFxtlz90xTlhlR8ljkZ0QWs'

async function testChannex() {
  console.log('Testing Channex staging API...')
  try {
    const res = await fetch('https://staging.channex.io/api/v1/properties', {
      headers: {
        'user-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })
    console.log('Staging Status:', res.status)
    const data = await res.json()
    console.log('Staging Response:', JSON.stringify(data, null, 2))
  } catch (e) {
    console.error('Staging Error:', e.message)
  }

  try {
    const res2 = await fetch('https://app.channex.io/api/v1/properties', {
      headers: {
        'user-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })
    console.log('Production Status:', res2.status)
    const data2 = await res2.json()
    console.log('Production Response:', JSON.stringify(data2, null, 2))
  } catch (e) {
    console.error('Production Error:', e.message)
  }
}

testChannex()
