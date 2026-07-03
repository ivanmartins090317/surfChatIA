"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveProfileAction } from "@/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@/lib/domain/types";
import { SURF_LEVELS, WAVE_TYPES } from "@/lib/domain/types";

interface ProfileFormProps {
  profile: Profile;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [surfLevel, setSurfLevel] = useState(profile.surf_level ?? "");
  const [waveType, setWaveType] = useState(profile.wave_type ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("surf_level", surfLevel);
    formData.set("wave_type", waveType);

    startTransition(async () => {
      const result = await saveProfileAction(formData);
      if (!result.success) {
        toast.error(result.error ?? "Erro ao salvar perfil.");
        return;
      }
      toast.success("Perfil atualizado.");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display_name">Nome *</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={profile.display_name ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Nível de surf *</Label>
        <Select value={surfLevel} onValueChange={setSurfLevel} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SURF_LEVELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="weight_kg">Peso (kg) *</Label>
          <Input
            id="weight_kg"
            name="weight_kg"
            type="number"
            step="0.1"
            defaultValue={profile.weight_kg ?? ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height_cm">Altura (cm) *</Label>
          <Input
            id="height_cm"
            name="height_cm"
            type="number"
            defaultValue={profile.height_cm ?? ""}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tipo de onda habitual *</Label>
        <Select value={waveType} onValueChange={setWaveType} required>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(WAVE_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending || !surfLevel || !waveType}>
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Salvando…
          </>
        ) : (
          "Salvar perfil"
        )}
      </Button>
    </form>
  );
}
