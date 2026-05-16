const authErrorMessages = new Map<string, string>([
	["invalid_credentials", "メールアドレスまたはパスワードが正しくありません。"],
	[
		"signup_failed",
		"アカウントを作成できませんでした。入力内容を確認してください。",
	],
	["password_mismatch", "確認用パスワードが一致していません。"],
	["missing_fields", "メールアドレスとパスワードを入力してください。"],
	["weak_password", "パスワードは6文字以上で入力してください。"],
]);

export function getAuthErrorMessage(code?: string) {
	if (!code) {
		return null;
	}

	return (
		authErrorMessages.get(code) ??
		"認証処理に失敗しました。時間をおいてもう一度お試しください。"
	);
}
