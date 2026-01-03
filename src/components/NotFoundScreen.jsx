"use client"

export default function NotFound() {

  return (
    <div className="status-screen-page">
      <div id="status-screen-content">
        <p id="awkward">This is awkward for all of us.</p>
        <p className="portal-blue">404</p>
        <p className="portal-orange">Not Found</p>
      </div>
      <img src="/img/not_found.svg" alt="Not Found" className="not-found-svg" />
    </div>
  )
}
