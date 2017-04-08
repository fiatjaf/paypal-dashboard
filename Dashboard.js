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

      plans: [],
      payments: [],

      selectedPlan: null,
      selectedPayment: null
    }
  },

  componentDidMount () {
    onLoggedStateChange(isLogged => {
      this.setState({isLogged})

      if (isLogged) {
        p('/v1/oauth2/token', null, 'POST', 'grant_type=client_credentials')
        .then(res => {
          this.setState({token: res.access_token})
          this.fetchPayments()
          this.fetchPlans()
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
                      href: 'https://developer.paypal.com/developer/applications/',
                      target: '_blank'
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
          this.state.plans && h('.column.is-full', [
            h('.card',
              this.state.selectedPlan === null
              ? [
                h('.card-header', [
                  h('p.card-header-title', 'Plans'),
                  h('p.card-header-icon', [
                    h('a', {onClick: () => { this.setState({selectedPlan: 'NEW'}) }}, [
                      h('span.icon', [
                        h('i.fa.fa-plus-square')
                      ])
                    ])
                  ])
                ]),
                h('.card-content', [
                  h('table.table', [
                    h('thead', [
                      h('tr', [
                        h('th', 'id'),
                        h('th', 'name'),
                        h('th', 'description'),
                        h('th', 'state'),
                        h('th', 'type'),
                        h('th')
                      ])
                    ]),
                    h('tbody', this.state.plans.map(p =>
                      h('tr', [
                        h('td', p.id),
                        h('td', p.name),
                        h('td', p.description),
                        h('td', p.state),
                        h('td', p.type),
                        h('td', [
                          h('button.button', {
                            onClick: () => { this.selectPlan(p.id) }
                          }, 'select')
                        ])
                      ])
                    ))
                  ])
                ])
              ]
              : this.state.selectedPlan === 'NEW'
                ? [
                  h('.card-header', [
                    h('p.card-header-title', `Create new plan`),
                    h('p.card-header-icon', [
                      h('a', {onClick: () => { this.setState({selectedPlan: null}) }}, [
                        h('span.icon', [
                          h('i.fa.fa-chevron-left')
                        ])
                      ])
                    ])
                  ]),
                  h('.card-content', [
                    h('form', {onSubmit: this.createPlan}, [
                      h('p.control', [
                        h('input', {placeholder: 'name', name: 'name'})
                      ]),
                      h('p.control', [
                        h('input', {placeholder: 'description', name: 'description'})
                      ]),
                      h('p.control', [
                        h('input', {placeholder: 'amount', name: 'amount'})
                      ]),
                      h('p.control', [
                        h('input', {placeholder: 'return_url', name: 'return_url'})
                      ]),
                      h('p.control', [
                        h('input', {placeholder: 'cancel_url', name: 'cancel_url'})
                      ]),
                      h('button.button', 'create!')
                    ])
                  ])
                ]
                : [
                  h('.card-header', [
                    h('p.card-header-title', `Plan ${this.state.selectedPlan.name}`),
                    h('p.card-header-icon', [
                      h('a', {onClick: () => { this.setState({selectedPlan: null}) }}, [
                        h('span.icon', [
                          h('i.fa.fa-chevron-left')
                        ])
                      ])
                    ])
                  ]),
                  h('.card-content', [
                    h('table', [
                      h('tbody', [
                        h('tr', [
                          h('th', 'id'),
                          h('td', this.state.selectedPlan.id)
                        ]),
                        h('tr', [
                          h('th', 'name'),
                          h('td', this.state.selectedPlan.name)
                        ]),
                        h('tr', [
                          h('th', 'description'),
                          h('td', this.state.selectedPlan.description)
                        ]),
                        h('tr', [
                          h('th', 'state'),
                          h('td', this.state.selectedPlan.state)
                        ]),
                        h('tr', [
                          h('th', 'return_url'),
                          h('td', this.state.selectedPlan.merchant_preferences.return_url)
                        ]),
                        h('tr', [
                          h('th', 'cancel_url'),
                          h('td', this.state.selectedPlan.merchant_preferences.cancel_url)
                        ]),
                        h('tr', [
                          h('th', 'frequency'),
                          h('td', this.state.selectedPlan.payment_definitions[0].frequency)
                        ]),
                        h('tr', [
                          h('th', 'amount'),
                          h('td', this.state.selectedPlan.payment_definitions[0].amount.value + ' ' + this.state.selectedPlan.payment_definitions[0].amount.currency)
                        ])
                      ])
                    ])
                  ])
                ]
            )
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
  },

  fetchPayments () {
    p('/v1/payments/payment', this.state.token, 'GET')
    .then(res => {
      if (res && res.payments) {
        this.setState({payments: res.payments})
      }
    })
    .catch(log.error)
  },

  fetchPlans () {
    p('/v1/payments/billing-plans', this.state.token, 'GET')
    .then(res => {
      if (res && res.plans) {
        this.setState({plans: res.plans})
      }
    })
    .catch(log.error)
  },

  selectPlan (id) {
    p(`/v1/payments/billing-plans/${id}`, this.state.token, 'GET')
    .then(res => {
      if (res) {
        this.setState({selectedPlan: res})
      }
    })
    .catch(log.error)
  },

  createPlan (e) {
    e.preventDefault()

    p('/v1/payments/billing-plans/', this.state.token, 'POST', JSON.stringify({
      name: e.target.name.value,
      description: e.target.description.value,
      type: 'INFINITE',
      payment_definitions: [{
        name: `paydef_${e.target.name.value}`,
        cycles: '0',
        type: 'REGULAR',
        frequency: 'MONTH',
        frequency_interval: '12',
        amount: {
          currency: 'USD',
          value: `${e.target.amount.value}`
        }
      }],
      merchant_preferences: {
        return_url: e.target.return_url.value,
        cancel_url: e.target.cancel_url.value,
        auto_bill_amount: 'YES',
        initial_fail_amount_action: 'CANCEL',
        max_fail_attempts: 12
      }
    }))
    .then(() => log.success('Plan created!'))
    .then(this.fetchPlans)
    .catch(log.error)
  }
})

module.exports = Dashboard
