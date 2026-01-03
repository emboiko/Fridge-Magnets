"use client"

import Header from "@/src/components/Header"
import FridgeCanvas from "@/src/components/FridgeCanvas/FridgeCanvas"
import Chat from "@/src/components/Chat"
import AdminPanel from "@/src/components/AdminPanel"
import AdminAuthModal from "@/src/components/AdminAuthModal"
import PingDisplay from "@/src/components/PingDisplay"
import { usePingMeasurement } from "@/src/hooks/usePingMeasurement"

export default function HomePage() {
  usePingMeasurement()

  return (
    <>
      <Header />
      <FridgeCanvas />
      <Chat />
      <AdminAuthModal />
      <AdminPanel />
      <PingDisplay />
    </>
  )
}
