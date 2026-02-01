import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
    component: Home,
})

function Home() {
    return (
        <main>
            <h1>Plaxe</h1>
            <p>Automated per-user media deletion for Plex</p>
        </main>
    )
}
