module.exports = {
  bot: {
    http: 'http://0.0.0.0:5700',
    ws: 'ws://0.0.0.0:6700'
  },
  plugin: {
    './plugin/qrcode': {},
    './plugin/dailes': {},
    './plugin/almanac': {},
    './plugin/run-js': {},
    './plugin/mm': {}
  }
}
