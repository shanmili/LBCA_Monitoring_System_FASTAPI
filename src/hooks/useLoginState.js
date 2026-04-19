import { useState } from 'react';

// Predefined credentials
const DEFAULT_EMAIL = 'admin@lbca.edu';
const DEFAULT_PASSWORD = 'admin123';

export default function useLoginState() {
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);

  const resetForm = () => {
    setEmail('');
    setPassword('');
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    resetForm,
  };
}
