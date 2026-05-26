process.argv = [
  process.argv[0],
  require.resolve('next/dist/bin/next'),
  'start',
  '-p',
  process.env.PORT || '3000',
]

require('next/dist/bin/next')
