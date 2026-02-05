<script lang="ts">
	let formStatus = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formStatus = 'submitting';

		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const response = await fetch('https://api.web3forms.com/submit', {
				method: 'POST',
				body: formData
			});

			const data = await response.json();

			if (data.success) {
				formStatus = 'success';
				form.reset();
			} else {
				formStatus = 'error';
			}
		} catch {
			formStatus = 'error';
		}
	}
</script>

<div class="terminal-form">
	{#if formStatus === 'success'}
		<div class="terminal-success">
			<div class="terminal-check">[OK]</div>
			<p class="terminal-msg">// Message sent successfully</p>
			<p class="terminal-sub">// I'll get back to you soon.</p>
		</div>
	{:else}
		<form onsubmit={handleSubmit} class="terminal-fields">
			<input type="hidden" name="access_key" value="6b5ed4bf-68a0-45cc-9b44-f89d78af8a94" />
			<input type="hidden" name="subject" value="New contact from milanrother.com" />
			<input type="hidden" name="from_name" value="Website Contact Form" />

			<div class="terminal-field">
				<label for="cf-name">// name</label>
				<div class="terminal-input-wrap">
					<span class="terminal-prompt">&gt;</span>
					<input
						type="text"
						id="cf-name"
						name="name"
						required
						placeholder="your name"
						autocomplete="name"
					/>
				</div>
			</div>

			<div class="terminal-field">
				<label for="cf-email">// email</label>
				<div class="terminal-input-wrap">
					<span class="terminal-prompt">&gt;</span>
					<input
						type="email"
						id="cf-email"
						name="email"
						required
						placeholder="you@example.com"
						autocomplete="email"
					/>
				</div>
			</div>

			<div class="terminal-field">
				<label for="cf-subject">// subject</label>
				<div class="terminal-input-wrap">
					<span class="terminal-prompt">&gt;</span>
					<input
						type="text"
						id="cf-subject"
						name="subject"
						required
						placeholder="what's this about?"
					/>
				</div>
			</div>

			<div class="terminal-field">
				<label for="cf-message">// message</label>
				<div class="terminal-input-wrap">
					<span class="terminal-prompt">&gt;</span>
					<textarea
						id="cf-message"
						name="message"
						rows="4"
						required
						placeholder="tell me about your project..."
					></textarea>
				</div>
			</div>

			{#if formStatus === 'error'}
				<p class="terminal-error">// error: something went wrong. try again or reach out on LinkedIn.</p>
			{/if}

			<button
				type="submit"
				disabled={formStatus === 'submitting'}
				class="terminal-submit"
			>
				{#if formStatus === 'submitting'}
					[ SENDING... ]
				{:else}
					[ SEND MESSAGE -&gt; ]
				{/if}
			</button>
		</form>
	{/if}

	<p class="terminal-alt">
		// or connect on <a href="https://linkedin.com/in/milan-rother-648474183" target="_blank" rel="noopener">LinkedIn</a>
	</p>
</div>

<style>
	.terminal-form {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 12px;
		color: #f0efe9;
	}

	.terminal-fields {
		display: flex;
		flex-direction: column;
		gap: 10px;
		flex: 1;
	}

	.terminal-field label {
		display: block;
		color: rgba(240, 239, 233, 0.4);
		font-size: 11px;
		margin-bottom: 2px;
	}

	.terminal-input-wrap {
		display: flex;
		align-items: flex-start;
		gap: 6px;
	}

	.terminal-prompt {
		color: #00d9c0;
		flex-shrink: 0;
		line-height: 1.8;
	}

	.terminal-input-wrap input,
	.terminal-input-wrap textarea {
		flex: 1;
		background: transparent;
		border: none;
		border-bottom: 1px solid rgba(240, 239, 233, 0.1);
		color: #f0efe9;
		font-family: inherit;
		font-size: inherit;
		padding: 4px 0;
		outline: none;
		resize: none;
		line-height: 1.5;
	}

	.terminal-input-wrap input::placeholder,
	.terminal-input-wrap textarea::placeholder {
		color: rgba(240, 239, 233, 0.2);
	}

	.terminal-input-wrap input:focus,
	.terminal-input-wrap textarea:focus {
		border-bottom-color: rgba(0, 217, 192, 0.5);
	}

	.terminal-submit {
		display: block;
		width: 100%;
		padding: 8px 0;
		margin-top: 4px;
		background: transparent;
		border: 1px solid rgba(0, 217, 192, 0.5);
		color: #00d9c0;
		font-family: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		letter-spacing: 0.05em;
	}

	.terminal-submit:hover {
		background: rgba(0, 217, 192, 0.1);
		border-color: #00d9c0;
	}

	.terminal-submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.terminal-error {
		color: #f87171;
		font-size: 11px;
	}

	.terminal-alt {
		margin-top: 10px;
		font-size: 11px;
		color: rgba(240, 239, 233, 0.3);
		text-align: center;
	}

	.terminal-alt a {
		color: #00d9c0;
		text-decoration: none;
	}

	.terminal-alt a:hover {
		color: #33e3cf;
	}

	.terminal-success {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex: 1;
		gap: 8px;
	}

	.terminal-check {
		color: #00d9c0;
		font-size: 18px;
		font-weight: 600;
	}

	.terminal-msg {
		color: rgba(240, 239, 233, 0.85);
		font-size: 13px;
	}

	.terminal-sub {
		color: rgba(240, 239, 233, 0.4);
		font-size: 11px;
	}
</style>
