import React, { useEffect, useCallback, useRef, useState } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Google Sign-In button using Google Identity Services (One Tap / Sign In With Google)
 * Loads the GSI script and renders a Google-styled button.
 */
const GoogleSignInButton = ({ onSuccess, onError, disabled = false, text = 'signin_with' }) => {
  const buttonRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('[GoogleSignIn] VITE_GOOGLE_CLIENT_ID not configured');
      setScriptError(true);
      return;
    }

    // Check if already loaded
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptLoaded(true));
      existingScript.addEventListener('error', () => setScriptError(true));
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('[GoogleSignIn] GSI script loaded');
      setScriptLoaded(true);
    };
    script.onerror = () => {
      console.error('[GoogleSignIn] Failed to load GSI script');
      setScriptError(true);
    };
    document.body.appendChild(script);

    return () => {
      // Don't remove script on unmount as other components might use it
    };
  }, []);

  // Handle credential response
  const handleCredentialResponse = useCallback(
    (response) => {
      console.log('[GoogleSignIn] Credential response received');
      if (response.credential) {
        onSuccess?.(response.credential);
      } else {
        console.error('[GoogleSignIn] No credential in response');
        onError?.(new Error('No credential received from Google'));
      }
    },
    [onSuccess, onError]
  );

  // Initialize Google Sign-In and render button
  useEffect(() => {
    if (!scriptLoaded || !buttonRef.current || !GOOGLE_CLIENT_ID) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: text,
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '100%',
      });

      console.log('[GoogleSignIn] Button rendered');
    } catch (error) {
      console.error('[GoogleSignIn] Failed to initialize:', error);
      setScriptError(true);
    }
  }, [scriptLoaded, handleCredentialResponse, text]);

  if (!GOOGLE_CLIENT_ID) {
    return null; // Don't show button if not configured
  }

  if (scriptError) {
    return (
      <button
        type="button"
        className="btn btn-google btn-disabled"
        disabled
        style={{ opacity: 0.5, cursor: 'not-allowed' }}
      >
        Google Sign-In unavailable
      </button>
    );
  }

  return (
    <div
      ref={buttonRef}
      className="google-signin-container"
      style={{
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '44px',
      }}
    />
  );
};

export default GoogleSignInButton;
