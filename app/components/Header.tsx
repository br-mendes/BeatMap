"use client";
import React from 'react'
import ThemeToggle from './ThemeToggle'

export default function Header(): JSX.Element {
  return (
    <header className="site-header" aria-label="Site header">
      <div className="site-title">
        <span style={{ width: 20, height: 20, borderRadius: 4, display: 'inline-block', background: 'var(--color-primary)' }} />
        <span>BeatMap</span>
      </div>
      <ThemeToggle />
    </header>
  )
}