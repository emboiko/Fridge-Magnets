"use client"

import Header from "@/src/components/Header"
import FridgeCanvas from "@/src/components/FridgeCanvas/FridgeCanvas"
import Chat from "@/src/components/Chat"
import AdminPanel from "@/src/components/AdminPanel"
import AdminAuthModal from "@/src/components/AdminAuthModal"

export default function HomePage() {
  return (
    <>
      <Header />
      <FridgeCanvas />
      <Chat />
      <AdminAuthModal />
      <AdminPanel />
    </>
  )
}
