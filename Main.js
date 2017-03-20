const React = require('react')
const h = require('react-hyperscript')
const page = require('page')

const Dashboard = require('./Dashboard')

const onLoggedStateChange = require('./auth').onLoggedStateChange
const removeCredentials = require('./auth').removeCredentials

module.exports = React.createClass({
  getInitialState () {
    return {
      isLogged: false,
      route: {
        component: () => h('div'),
        props: {}
      }
    }
  },

  componentDidMount () {
    onLoggedStateChange(isLogged => {
      this.setState({isLogged})
    })

    page('/', () =>
      this.setState({route: {component: Dashboard}})
    )

    page()
  },

  render () {
    return (
      h('div', [
        h('nav.nav', [
          h('.nav-left', [
            h('a.nav-item', 'Paypal Dashboard')
          ]),
          h('.nav-center', [
            this.state.isLogged && h('a.nav-item', {onClick: this.logout}, 'erase your credentials')
          ])
        ]),
        h(this.state.route.component, this.state.route.props)
      ])
    )
  },

  logout () {
    removeCredentials()
  }
})
