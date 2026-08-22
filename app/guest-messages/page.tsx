import { redirect } from 'next/navigation'

export default function GuestMessagesRedirect() {
  redirect('/dashboard/guest-messages')
}
