export function formatEmailDate(timestamp: string | number | Date): string {
    const date = new Date(timestamp);
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();

    const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    if (sameYear) {
        const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${dateString}, ${timeString}`;
    } else {
        const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${dateString}, ${timeString}`;
    }
}