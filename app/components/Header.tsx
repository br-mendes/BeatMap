"use client";
import React from 'react'
import ThemeToggle from './ThemeToggle'

export default function Header(): JSX.Element {
  return (
    <header className="site-header" aria-label="Site header">
      <div className="site-title">
        <div className="site-logo" aria-hidden="true">BM</div>
        <span>BeatMap</span>
      </div>
      <ThemeToggle />
    </header>
  )
}