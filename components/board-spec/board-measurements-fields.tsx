"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  COMMON_BOARD_VOLUMES_L,
  formatConversionHint,
  formatFractionalInches,
  formatSurfLength,
  formatVolumeLiters,
  LINEAR_UNIT_MODES,
  parseLengthFromFeetInches,
  parseMetricToInches,
  parseSurfWholeFractionInches,
  parseVolumeLiters,
  THICKNESS_FRACTIONS,
  type BoardMeasurementInitialValues,
  type LinearUnitMode,
} from "@/lib/board/measurements";
import { cn } from "@/lib/utils";

interface BoardMeasurementsFieldsProps {
  disabled?: boolean;
  showThickness?: boolean;
  legend?: string;
  initialValues?: BoardMeasurementInitialValues;
}

function useInitialMeasurementState(initialValues?: BoardMeasurementInitialValues) {
  return {
    lengthFeet: initialValues?.lengthFeet ?? "",
    lengthInchesPart: initialValues?.lengthInchesPart ?? "",
    widthWhole: initialValues?.widthWhole ?? "",
    widthFraction: initialValues?.widthFraction ?? "0",
    thicknessWhole: initialValues?.thicknessWhole ?? "",
    thicknessFraction: initialValues?.thicknessFraction ?? "0",
    volumeValue: initialValues?.volumeValue ?? "",
  };
}

interface SurfInchesFractionFieldProps {
  id: string;
  label: string;
  whole: string;
  fraction: string;
  metricValue: string;
  linearMode: LinearUnitMode;
  disabled?: boolean;
  wholePlaceholder: string;
  metricPlaceholder: string;
  onWholeChange: (value: string) => void;
  onFractionChange: (value: string) => void;
  onMetricChange: (value: string) => void;
  hint?: string | null;
}

function SurfInchesFractionField({
  id,
  label,
  whole,
  fraction,
  metricValue,
  linearMode,
  disabled = false,
  wholePlaceholder,
  metricPlaceholder,
  onWholeChange,
  onFractionChange,
  onMetricChange,
  hint,
}: SurfInchesFractionFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {linearMode === "surf" ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id={id}
            inputMode="numeric"
            placeholder={wholePlaceholder}
            value={whole}
            disabled={disabled}
            onChange={(event) => onWholeChange(event.target.value)}
            className="w-20 tabular-nums"
            aria-label={`Polegadas inteiras — ${label.toLowerCase()}`}
          />
          <Select
            value={fraction}
            onValueChange={onFractionChange}
            disabled={disabled}
          >
            <SelectTrigger className="min-w-[112px]" aria-label={`Fração — ${label.toLowerCase()}`}>
              <SelectValue placeholder="Fração" />
            </SelectTrigger>
            <SelectContent align="start">
              {THICKNESS_FRACTIONS.map((item) => (
                <SelectItem key={item.label} value={String(item.value)}>
                  {item.label === "—" ? "Sem fração" : item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">&quot;</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            id={id}
            inputMode="decimal"
            placeholder={metricPlaceholder}
            value={metricValue}
            disabled={disabled}
            onChange={(event) => onMetricChange(event.target.value)}
            className="tabular-nums"
          />
          <span className="shrink-0 text-sm text-muted-foreground">
            {LINEAR_UNIT_MODES[linearMode].short}
          </span>
        </div>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function BoardMeasurementsFields({
  disabled = false,
  showThickness = true,
  legend = "Medidas (opcional)",
  initialValues,
}: BoardMeasurementsFieldsProps) {
  const defaults = useInitialMeasurementState(initialValues);
  const [linearMode, setLinearMode] = useState<LinearUnitMode>("surf");
  const [lengthFeet, setLengthFeet] = useState(defaults.lengthFeet);
  const [lengthInchesPart, setLengthInchesPart] = useState(defaults.lengthInchesPart);
  const [lengthMetric, setLengthMetric] = useState("");
  const [widthWhole, setWidthWhole] = useState(defaults.widthWhole);
  const [widthFraction, setWidthFraction] = useState(defaults.widthFraction);
  const [widthMetric, setWidthMetric] = useState("");
  const [thicknessWhole, setThicknessWhole] = useState(defaults.thicknessWhole);
  const [thicknessFraction, setThicknessFraction] = useState(defaults.thicknessFraction);
  const [thicknessMetric, setThicknessMetric] = useState("");
  const [volumeValue, setVolumeValue] = useState(defaults.volumeValue);

  const lengthIn = useMemo(() => {
    if (linearMode === "surf") {
      return parseLengthFromFeetInches(lengthFeet, lengthInchesPart);
    }
    return parseMetricToInches(lengthMetric, linearMode);
  }, [linearMode, lengthFeet, lengthInchesPart, lengthMetric]);

  const widthIn = useMemo(() => {
    if (linearMode === "surf") {
      return parseSurfWholeFractionInches(widthWhole, Number(widthFraction));
    }
    return parseMetricToInches(widthMetric, linearMode);
  }, [linearMode, widthFraction, widthMetric, widthWhole]);

  const thicknessIn = useMemo(() => {
    if (!showThickness) return null;

    if (linearMode === "surf") {
      return parseSurfWholeFractionInches(
        thicknessWhole,
        Number(thicknessFraction),
      );
    }

    return parseMetricToInches(thicknessMetric, linearMode);
  }, [
    linearMode,
    showThickness,
    thicknessFraction,
    thicknessMetric,
    thicknessWhole,
  ]);

  const volumeL = useMemo(() => parseVolumeLiters(volumeValue), [volumeValue]);

  const lengthHint =
    lengthIn != null ? formatConversionHint(lengthIn, linearMode) : null;
  const widthHint =
    widthIn != null ? formatConversionHint(widthIn, linearMode) : null;
  const thicknessHint =
    thicknessIn != null ? formatConversionHint(thicknessIn, linearMode) : null;

  const summaryParts = [
    lengthIn != null ? formatSurfLength(lengthIn) : null,
    widthIn != null ? `${formatFractionalInches(widthIn)} largura` : null,
    thicknessIn != null ? formatFractionalInches(thicknessIn) : null,
    volumeL != null ? formatVolumeLiters(volumeL) : null,
  ].filter(Boolean);

  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-sm font-medium text-muted-foreground">
        {legend}
      </legend>

      <p className="text-xs text-muted-foreground">
        Padrão do surf:{" "}
        <span className="text-foreground/80">
          5&apos;7&quot; · 19 1/2&quot; · 2 1/2&quot; · 28 L
        </span>
        . Use polegadas ou alterne para cm/mm.
      </p>

      <Tabs
        value={linearMode}
        onValueChange={(value) => setLinearMode(value as LinearUnitMode)}
      >
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1">
          {(Object.keys(LINEAR_UNIT_MODES) as LinearUnitMode[]).map((mode) => (
            <TabsTrigger
              key={mode}
              value={mode}
              disabled={disabled}
              className="min-h-[36px] px-2 text-xs sm:text-sm"
            >
              {LINEAR_UNIT_MODES[mode].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {summaryParts.length > 0 && (
        <p
          className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground"
          aria-live="polite"
        >
          <span className="font-medium text-primary">Resumo:</span>{" "}
          {summaryParts.join(" · ")}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="board-length-feet">Comprimento</Label>
          {linearMode === "surf" ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-[88px] flex-1 items-center gap-2">
                <Input
                  id="board-length-feet"
                  inputMode="numeric"
                  placeholder="5"
                  value={lengthFeet}
                  disabled={disabled}
                  onChange={(event) => setLengthFeet(event.target.value)}
                  className="tabular-nums"
                  aria-label="Pés"
                />
                <span className="text-sm text-muted-foreground">&apos;</span>
              </div>
              <div className="flex min-w-[88px] flex-1 items-center gap-2">
                <Input
                  id="board-length-inches"
                  inputMode="decimal"
                  placeholder="7"
                  value={lengthInchesPart}
                  disabled={disabled}
                  onChange={(event) => setLengthInchesPart(event.target.value)}
                  className="tabular-nums"
                  aria-label="Polegadas do comprimento"
                />
                <span className="text-sm text-muted-foreground">&quot;</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                id="board-length-metric"
                inputMode="decimal"
                placeholder={linearMode === "cm" ? "170" : "1700"}
                value={lengthMetric}
                disabled={disabled}
                onChange={(event) => setLengthMetric(event.target.value)}
                className="tabular-nums"
              />
              <span className="shrink-0 text-sm text-muted-foreground">
                {LINEAR_UNIT_MODES[linearMode].short}
              </span>
            </div>
          )}
          {lengthHint && (
            <p className="text-xs text-muted-foreground">{lengthHint}</p>
          )}
        </div>

        <SurfInchesFractionField
          id="board-width"
          label="Largura"
          whole={widthWhole}
          fraction={widthFraction}
          metricValue={widthMetric}
          linearMode={linearMode}
          disabled={disabled}
          wholePlaceholder="19"
          metricPlaceholder={linearMode === "cm" ? "48,3" : "483"}
          onWholeChange={setWidthWhole}
          onFractionChange={setWidthFraction}
          onMetricChange={setWidthMetric}
          hint={widthHint}
        />

        {showThickness && (
          <SurfInchesFractionField
            id="board-thickness"
            label="Espessura"
            whole={thicknessWhole}
            fraction={thicknessFraction}
            metricValue={thicknessMetric}
            linearMode={linearMode}
            disabled={disabled}
            wholePlaceholder="2"
            metricPlaceholder={linearMode === "cm" ? "6,4" : "64"}
            onWholeChange={setThicknessWhole}
            onFractionChange={setThicknessFraction}
            onMetricChange={setThicknessMetric}
            hint={thicknessHint}
          />
        )}

        <div className={cn("space-y-2", !showThickness && "sm:col-span-2")}>
          <Label htmlFor="board-volume">Volume</Label>
          <div className="flex items-center gap-2">
            <Input
              id="board-volume"
              inputMode="decimal"
              placeholder="28,2"
              value={volumeValue}
              disabled={disabled}
              onChange={(event) => setVolumeValue(event.target.value)}
              className="tabular-nums"
            />
            <span className="shrink-0 text-sm text-muted-foreground">L</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {COMMON_BOARD_VOLUMES_L.map((volume) => (
              <button
                key={volume}
                type="button"
                disabled={disabled}
                onClick={() => setVolumeValue(String(volume))}
                className={cn(
                  "min-h-[36px] rounded-full border px-3 text-xs font-medium transition-colors",
                  volumeValue === String(volume)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-white/14 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {volume} L
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Litragem em litros (ex.: 28,2 ou 25,75); deixe vazio se não souber.
          </p>
        </div>
      </div>

      <input
        type="hidden"
        name="length_in"
        value={lengthIn ?? ""}
        readOnly
      />
      <input type="hidden" name="width_in" value={widthIn ?? ""} readOnly />
      {showThickness && (
        <input
          type="hidden"
          name="thickness_in"
          value={thicknessIn ?? ""}
          readOnly
        />
      )}
      <input type="hidden" name="volume_l" value={volumeL ?? ""} readOnly />
    </fieldset>
  );
}
