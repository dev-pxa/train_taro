import React, { Component } from 'react'

import type { PropsWithChildren } from 'react'
import { AuthProvider } from './contexts/AuthContext'

import './app.scss'

class App extends Component<PropsWithChildren> {

  componentDidMount() { }

  componentDidShow() { }

  componentDidHide() { }

  // this.props.children 是将要会渲染的页面
  render() {
    return React.createElement(AuthProvider, null, this.props.children)
  }
}


export default App
