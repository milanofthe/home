// Shared contact form submission: validation + Formspark POST. Used by the
// landing grid form (CodeRainPage) and the article page forms.

export const CONTACT_ACTION = 'https://whatsmytraffic.com/f/dekijnkgbvrk';

export interface SubmitResult {
	status: 'success' | 'error';
	message: string;
}

export async function submitContactForm(form: HTMLFormElement): Promise<SubmitResult> {
	const field = (name: string) => {
		const el = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
		return (el?.value ?? '').trim();
	};
	if (!field('name') || !field('email') || !field('subject') || !field('message')) {
		return { status: 'error', message: '> all fields are required' };
	}
	// type="email" still accepts "a@b": insist on a domain with a dot.
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field('email'))) {
		return { status: 'error', message: '> that email address looks off' };
	}

	const formData = new FormData(form);
	// JSON, not multipart/form-data: Formspark currently rejects multipart
	// bodies with `formspark-status: empty` and drops the submission, even
	// though it answers 200.
	const payload: Record<string, string> = {};
	for (const [key, value] of formData.entries()) {
		payload[key] = typeof value === 'string' ? value : '';
	}
	try {
		const response = await fetch(CONTACT_ACTION, {
			method: 'POST',
			body: JSON.stringify(payload),
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
		});
		if (response.ok) {
			return { status: 'success', message: '> message sent. talk soon' };
		}
	} catch {
		// fall through
	}
	return { status: 'error', message: '> send failed. email info@milanrother.com' };
}
