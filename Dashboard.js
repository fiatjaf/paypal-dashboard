const React = require('react')
const h = require('react-hyperscript')

const log = require('./log')
const p = require('./auth').paypal
const setCredentials = require('./auth').setCredentials
const toggleLive = require('./auth').toggleLive
const isLive = require('./auth').isLive
const onLoggedStateChange = require('./auth').onLoggedStateChange

const Dashboard = React.createClass({
  getInitialState () {
    return {
      isLogged: false,
      token: '',

      payments: null
    }
  },

  componentDidMount () {
    onLoggedStateChange(isLogged => {
      this.setState({isLogged})

      if (isLogged) {
        p('/v1/oauth2/token', null, 'POST', 'grant_type=client_credentials')
        .then(res => {
          this.setState({token: res.access_token})

          p('/v1/payments/payment', res.access_token, 'GET')
          .then(({payments, count}) => {
            this.setState({payments})
          })
          .catch(log.error)

          p('/v1/payments/billing-agreements', res.access_token, 'GET')
          .then((res) => {
            console.log(res)
          })
          .catch(log.error)
        })
        .catch(log.error)
      }
    })
  },

  render () {
    return (
      h('.container', [
        h('.columns.is-multiline', [
          h('.column.is-full', [
            this.state.isLogged
            ? (
              h('.card', [
                h('.card-header', [
                  h('p.card-header-title', 'Token for this session'),
                  h('p.card-header-icon', [
                    h('button.button.is-warning', {
                      className: isLive() ? '' : 'is-active',
                      onClick: toggleLive
                    }, 'Sandbox')
                  ])
                ]),
                h('.card-content', [
                  h('p', this.state.token)
                ])
              ])
            )
            : (
              h('.card', [
                h('.card-content', [
                  h('p', [
                    'Create an app and get a Client ID and Secret at ',
                    h('a', {
                      href: 'https://developer.paypal.com/developer/applications/'
                    }, 'https://developer.paypal.com/developer/applications/'),
                    ':'
                  ]),
                  h('form', {onSubmit: this.handleCredentials}, [
                    h('p.control', [
                      h('input.input', {name: 'clientId', placeholder: 'Client ID'})
                    ]),
                    h('p.control', [
                      h('input.input', {name: 'secret', placeholder: 'Secret'})
                    ]),
                    h('p.control', [
                      h('button.button', 'Store credentials locally')
                    ])
                  ])
                ])
              ])
            )
          ]),
          this.state.agreements && h('.column.is-full', [
            h('.card', [
              h('.card-header', [
                h('p.card-header-title', 'Last payments')
              ]),
              h('.card-content', [
                h('table.table', [
                  h('thead', [
                    h('tr', [
                    ])
                  ]),
                  h('tbody', this.state.agreements.map(p =>
                    h('tr', [
                    ])
                  ))
                ])
              ])
            ])
          ]),
          this.state.payments && h('.column.is-full', [
            h('.card', [
              h('.card-header', [
                h('p.card-header-title', 'Last payments')
              ]),
              h('.card-content', [
                h('table.table', [
                  h('thead', [
                    h('tr', [
                      h('th', 'id'),
                      h('th', 'date'),
                      h('th', 'transaction'),
                      h('th', 'payer'),
                      h('th', 'email')
                    ])
                  ]),
                  h('tbody', this.state.payments.map(p =>
                    h('tr', [
                      h('td', p.id),
                      h('td', p.update_time),
                      h('td', [
                        h('table.table', [
                          h('tbody', p.transactions.map(txn =>
                            h('tr', [
                              h('td', txn.description),
                              h('td', txn.amount.total + ' ' + txn.amount.currency)
                            ])
                          ))
                        ])
                      ]),
                      h('td', p.payer.payer_info.first_name + ' ' + p.payer.payer_info.last_name),
                      h('td', p.payer.payer_info.email)
                    ])
                  ))
                ])
              ])
            ])
          ])
        ])
      ])
    )
  },

  handleCredentials (e) {
    e.preventDefault()
    setCredentials(e.target.clientId.value.trim(), e.target.secret.value.trim())
  }
})

module.exports = Dashboard
