import { Redirect } from 'expo-router';
import React from 'react';
import { useAppStore } from '../src/store/useAppStore';

export default function Index() {
  const onboarded = useAppStore((s) => s.onboarded);
  return <Redirect href={onboarded ? '/today' : '/onboarding'} />;
}
