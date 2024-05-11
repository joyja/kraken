<div class="legend">
	<div>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
			><title>apps</title><path
				fill="var(--theme-neutral-950)"
				d="M16,20H20V16H16M16,14H20V10H16M10,8H14V4H10M16,8H20V4H16M10,14H14V10H10M4,14H8V10H4M4,20H8V16H4M10,20H14V16H10M4,8H8V4H4V8Z"
			/></svg
		>
		<span>= Group</span>
	</div>
	<div>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
			><title>record-circle-outline</title><path
				fill="var(--theme-neutral-950)"
				d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z"
			/></svg
		>
		<span>= Node</span>
	</div>
	<div>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
			><title>nas</title><path
				fill="var(--theme-neutral-950)"
				d="M4,5C2.89,5 2,5.89 2,7V17C2,18.11 2.89,19 4,19H20C21.11,19 22,18.11 22,17V7C22,5.89 21.11,5 20,5H4M4.5,7A1,1 0 0,1 5.5,8A1,1 0 0,1 4.5,9A1,1 0 0,1 3.5,8A1,1 0 0,1 4.5,7M7,7H20V17H7V7M8,8V16H11V8H8M12,8V16H15V8H12M16,8V16H19V8H16M9,9H10V10H9V9M13,9H14V10H13V9M17,9H18V10H17V9Z"
			/></svg
		>
		<span>= Device</span>
	</div>
</div>

<style land="scss">
	.legend {
		display: flex;
		align-items: center;
		& > div {
			display: flex;
			align-items: center;
			& > svg {
				height: 24px;
				width: 24px;
			}
		}
		& > * {
			margin-left: calc(var(--spacing-unit) * 3);
		}
		margin-bottom: calc(var(--spacing-unit) * 2);
	}
</style>
