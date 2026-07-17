import React, { Component } from 'react'

import type { PropsWithChildren } from 'react'
import { AuthProvider } from './contexts/AuthContext'

import './app.scss'

const CHUNK_RELOAD_KEY = 'train_taro_chunk_reload_at'
const CHUNK_RELOAD_COOLDOWN = 60 * 1000

// 线上 H5 发版后，用户可能还持有旧入口包，并继续请求旧 chunk。
// 捕获这类 chunk 加载失败后刷新一次，让浏览器重新拉取最新 index.html。
function isChunkAsset(url?: string): boolean {
  return Boolean(url && /\/chunk\/.+\.js(?:\?|$)/.test(url))
}

function reloadOnceForChunkError(): void {
  if (typeof window === 'undefined') return

  const now = Date.now()
  const lastReloadAt = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0)
  if (now - lastReloadAt < CHUNK_RELOAD_COOLDOWN) return

  window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now))
  window.location.reload()
}

function installChunkErrorReload(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (event) => {
    const target = event.target as HTMLScriptElement | null
    const scriptSrc = target?.src
    const filename = event.filename
    const message = event.message || ''

    if (
      isChunkAsset(scriptSrc) ||
      isChunkAsset(filename) ||
      (/Invalid or unexpected token|ChunkLoadError|Loading chunk/.test(message) && isChunkAsset(filename))
    ) {
      reloadOnceForChunkError()
    }
  }, true)

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const message = String(reason?.message || reason || '')
    const request = String(reason?.request || '')

    if (/ChunkLoadError|Loading chunk/.test(message) || isChunkAsset(request)) {
      reloadOnceForChunkError()
    }
  })
}

installChunkErrorReload()

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
