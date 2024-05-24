export class EventTracker {
	private events: Date[] = []

	// Record an event occurrence
	public recordEvent(): void {
		const now = new Date()
		this.events.push(now)
		this.cleanup()
	}

	// Cleanup events outside of the maximum timeframe (for efficiency)
	private cleanup(): void {
		const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
		this.events = this.events.filter((eventDate) => eventDate > threeDaysAgo)
	}

	// Count events within a given timeframe in milliseconds
	public inTimeframe(timeframeMs: number): number {
		const threshold = new Date(Date.now() - timeframeMs)
		return this.events.filter((eventDate) => eventDate > threshold).length
	}

	// Convenience methods for specific timeframes
	public inLastMinute(): number {
		return this.inTimeframe(60 * 1000)
	}

	public inLastHour(): number {
		return this.inTimeframe(60 * 60 * 1000)
	}

	public inLastDay(): number {
		return this.inTimeframe(24 * 60 * 60 * 1000)
	}
}
