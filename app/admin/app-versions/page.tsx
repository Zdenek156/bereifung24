'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Save, Apple, Smartphone } from 'lucide-react';

interface AppVersionConfig {
  id: string;
  platform: 'ios' | 'android';
  minVersion: string;
  latestVersion: string;
  forceUpdate: boolean;
  storeUrl: string;
  message: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

const PLATFORMS: Array<{
  key: 'ios' | 'android';
  label: string;
  Icon: typeof Apple;
  defaultStoreUrl: string;
}> = [
  {
    key: 'ios',
    label: 'iOS (App Store)',
    Icon: Apple,
    defaultStoreUrl: 'https://apps.apple.com/de/app/bereifung24/id0000000000',
  },
  {
    key: 'android',
    label: 'Android (Play Store)',
    Icon: Smartphone,
    defaultStoreUrl:
      'https://play.google.com/store/apps/details?id=de.bereifung24.bereifung24_app',
  },
];

interface PlatformFormState {
  minVersion: string;
  latestVersion: string;
  storeUrl: string;
  forceUpdate: boolean;
  message: string;
}

const emptyState: PlatformFormState = {
  minVersion: '',
  latestVersion: '',
  storeUrl: '',
  forceUpdate: false,
  message: '',
};

export default function AppVersionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [configs, setConfigs] = useState<Record<string, AppVersionConfig | null>>({
    ios: null,
    android: null,
  });
  const [forms, setForms] = useState<Record<string, PlatformFormState>>({
    ios: { ...emptyState },
    android: { ...emptyState },
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/app-versions');
      if (!res.ok) throw new Error('load failed');
      const list: AppVersionConfig[] = await res.json();

      const next: Record<string, AppVersionConfig | null> = {
        ios: null,
        android: null,
      };
      const formsNext: Record<string, PlatformFormState> = {
        ios: { ...emptyState },
        android: { ...emptyState },
      };

      for (const p of PLATFORMS) {
        const found = list.find((c) => c.platform === p.key) ?? null;
        next[p.key] = found;
        formsNext[p.key] = {
          minVersion: found?.minVersion ?? '',
          latestVersion: found?.latestVersion ?? '',
          storeUrl: found?.storeUrl ?? p.defaultStoreUrl,
          forceUpdate: found?.forceUpdate ?? false,
          message: found?.message ?? '',
        };
      }
      setConfigs(next);
      setForms(formsNext);
    } catch (e) {
      console.error(e);
      alert('Konfiguration konnte nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }

  async function save(platform: 'ios' | 'android') {
    const f = forms[platform];
    if (!f.minVersion.trim() || !f.latestVersion.trim() || !f.storeUrl.trim()) {
      alert('Bitte minVersion, latestVersion und storeUrl ausfüllen.');
      return;
    }
    setSaving(platform);
    try {
      const res = await fetch('/api/admin/app-versions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, ...f }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'save failed');
      }
      await load();
    } catch (e: any) {
      alert('Speichern fehlgeschlagen: ' + (e?.message ?? e));
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin')}
          aria-label="Zurück"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">App-Versionen</h1>
          <p className="text-sm text-muted-foreground">
            Steuere Pflicht-Updates und Store-Links für die Mobile App.
          </p>
        </div>
      </div>

      <Card className="mb-6 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base">So funktioniert es</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>minVersion</strong> – installierte App-Versionen <em>kleiner</em>{' '}
            als dieser Wert sehen einen Pflicht-Update-Dialog (nicht schließbar).
          </p>
          <p>
            <strong>latestVersion</strong> – aktuelle Store-Version. Liegt die
            installierte Version dazwischen, kommt nur ein freundlicher Hinweis.
          </p>
          <p>
            <strong>forceUpdate</strong> – erzwingt das Update unabhängig von
            minVersion (Notfall-Schalter z.&nbsp;B. bei kritischen Bugs).
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {PLATFORMS.map(({ key, label, Icon }) => {
          const f = forms[key];
          const cfg = configs[key];
          return (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {label}
                </CardTitle>
                <CardDescription>
                  {cfg ? (
                    <span>
                      Zuletzt aktualisiert:{' '}
                      {new Date(cfg.updatedAt).toLocaleString('de-DE')}
                      {cfg.updatedBy ? ` · ${cfg.updatedBy}` : ''}
                    </span>
                  ) : (
                    <Badge variant="outline">Noch nicht konfiguriert</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor={`${key}-min`}>Min. Version (Pflicht)</Label>
                  <Input
                    id={`${key}-min`}
                    placeholder="z.B. 1.0.10"
                    value={f.minVersion}
                    onChange={(e) =>
                      setForms((s) => ({
                        ...s,
                        [key]: { ...s[key], minVersion: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`${key}-latest`}>Aktuelle Store-Version</Label>
                  <Input
                    id={`${key}-latest`}
                    placeholder="z.B. 1.0.13"
                    value={f.latestVersion}
                    onChange={(e) =>
                      setForms((s) => ({
                        ...s,
                        [key]: { ...s[key], latestVersion: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`${key}-store`}>Store-URL</Label>
                  <Input
                    id={`${key}-store`}
                    placeholder="https://…"
                    value={f.storeUrl}
                    onChange={(e) =>
                      setForms((s) => ({
                        ...s,
                        [key]: { ...s[key], storeUrl: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`${key}-msg`}>
                    Custom-Nachricht (optional)
                  </Label>
                  <Textarea
                    id={`${key}-msg`}
                    rows={3}
                    placeholder="z.B. Wichtiges Sicherheits-Update"
                    value={f.message}
                    onChange={(e) =>
                      setForms((s) => ({
                        ...s,
                        [key]: { ...s[key], message: e.target.value },
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor={`${key}-force`} className="font-medium">
                      Update erzwingen
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Alle Nutzer werden zum Update gezwungen.
                    </p>
                  </div>
                  <Checkbox
                    id={`${key}-force`}
                    checked={f.forceUpdate}
                    onCheckedChange={(v) =>
                      setForms((s) => ({
                        ...s,
                        [key]: { ...s[key], forceUpdate: v === true },
                      }))
                    }
                  />
                </div>

                <Button
                  onClick={() => save(key)}
                  disabled={saving === key}
                  className="w-full"
                >
                  {saving === key ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern…
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Speichern
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
