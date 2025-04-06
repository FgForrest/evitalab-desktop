/**
 * Computes short name (initials) for connection for displaying in tight spaces
 */
export function computeShortConnectionName(connectionName: string): string {
    const parts: string[] = connectionName.split(/\s+/)
    if (parts.length > 3) {
        return parts.slice(0, 2).map(part => part.substring(0, 1).toUpperCase()).join('') +
            parts.at(-1).substring(0, 1).toUpperCase()
    } else {
        return parts.map(part => part.substring(0, 1).toUpperCase()).join('')
    }
}
