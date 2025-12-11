const RESET_OTP_KEY = 'online-annavaram@reset-otp';

export function persistResetOtp(payload) {
  if (!payload) return;
  try {
    const { email, otp } = payload;
    sessionStorage.setItem(
      RESET_OTP_KEY,
      JSON.stringify({
        email: email?.toLowerCase?.() || '',
        otp: otp || '',
        ts: Date.now(),
      })
    );
  } catch (error) {
    console.warn('Unable to persist reset OTP', error);
  }
}

export function readResetOtp() {
  try {
    const raw = sessionStorage.getItem(RESET_OTP_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Unable to read stored reset OTP', error);
    return null;
  }
}

export function clearResetOtp() {
  try {
    sessionStorage.removeItem(RESET_OTP_KEY);
  } catch (error) {
    console.warn('Unable to clear stored reset OTP', error);
  }
}
