"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PROGRAMS,
  SCHOOL_BOARDS,
  SCHOOL_STATUSES,
  type School,
} from "@/types/school";
import { createSchoolAction, updateSchoolAction } from "./actions";
import {
  BOARD_LABELS,
  INDIAN_STATES,
  PROGRAM_LABELS,
  STATUS_LABELS,
} from "./constants";
import type { SchoolFormField, SchoolFormState, SchoolFormValues } from "./schema";

type SchoolFormProps = { school?: School };

const boardItems = SCHOOL_BOARDS.map((value) => ({ value, label: BOARD_LABELS[value] }));
const statusItems = SCHOOL_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));
const stateItems = INDIAN_STATES.map((value) => ({ value, label: value }));

function toFormValues(school?: School): SchoolFormValues {
  if (!school) return { status: "ACTIVE", programs: [] };

  return {
    name: school.name,
    board: school.board,
    status: school.status,
    programs: school.programs,
    principalName: school.principalName ?? "",
    contactName: school.contactName,
    contactEmail: school.contactEmail,
    contactPhone: school.contactPhone,
    addressLine: school.addressLine,
    city: school.city,
    state: school.state,
    pincode: school.pincode,
    studentStrength: school.studentStrength?.toString() ?? "",
    notes: school.notes ?? "",
  };
}

export function SchoolForm({ school }: SchoolFormProps) {
  const router = useRouter();
  const action = school
    ? updateSchoolAction.bind(null, school.id)
    : createSchoolAction;
  const [state, formAction, pending] = useActionState<SchoolFormState, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (state?.status === "success") {
      toast.success(school ? "School updated" : "School registered");
      router.push(`/admin/schools/${state.schoolId}`);
    } else if (state?.status === "error" && state.message && !state.fieldErrors) {
      toast.error(state.message);
    }
  }, [state, school, router]);

  const values = state?.status === "error" ? state.values : toFormValues(school);
  const errors = state?.status === "error" ? state.fieldErrors ?? {} : {};
  const formKey = state?.status === "error" ? state.submittedAt : (school?.updatedAt ?? "new");

  const fieldProps = (name: Exclude<SchoolFormField, "programs">) => ({
    id: name,
    name,
    defaultValue: values[name],
    "aria-invalid": errors[name] ? true : undefined,
  });

  const error = (name: SchoolFormField) =>
    errors[name] ? <FieldError>{errors[name]?.[0]}</FieldError> : null;

  const invalid = (name: SchoolFormField) => (errors[name] ? true : undefined);

  return (
    <form key={formKey} action={formAction} noValidate className="space-y-6">
      {state?.status === "error" && state.fieldErrors && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          {state.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>School details</CardTitle>
          <CardDescription>Basic information about the school.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-5 md:grid-cols-2">
            <Field data-invalid={invalid("name")} className="md:col-span-2">
              <FieldLabel htmlFor="name">School name *</FieldLabel>
              <Input {...fieldProps("name")} autoComplete="organization" placeholder="e.g. Delhi Public School, Banjara Hills" />
              {error("name")}
            </Field>

            <Field data-invalid={invalid("board")}>
              <FieldLabel htmlFor="board">Board *</FieldLabel>
              <Select name="board" items={boardItems} defaultValue={values.board ?? null}>
                <SelectTrigger id="board" className="w-full" aria-invalid={invalid("board")}>
                  <SelectValue placeholder="Select a board" />
                </SelectTrigger>
                <SelectContent>
                  {boardItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error("board")}
            </Field>

            <Field data-invalid={invalid("status")}>
              <FieldLabel htmlFor="status">Status *</FieldLabel>
              <Select name="status" items={statusItems} defaultValue={values.status ?? "ACTIVE"}>
                <SelectTrigger id="status" className="w-full" aria-invalid={invalid("status")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error("status")}
            </Field>

            <Field data-invalid={invalid("principalName")}>
              <FieldLabel htmlFor="principalName">Principal name</FieldLabel>
              <Input {...fieldProps("principalName")} placeholder="Optional" />
              {error("principalName")}
            </Field>

            <Field data-invalid={invalid("studentStrength")}>
              <FieldLabel htmlFor="studentStrength">Student strength</FieldLabel>
              <Input {...fieldProps("studentStrength")} inputMode="numeric" placeholder="e.g. 1200" />
              {error("studentStrength")}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Programs</CardTitle>
          <CardDescription>Programs the school is enrolled in.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROGRAMS.map((program) => (
              <FieldLabel key={program} htmlFor={`program-${program}`}>
                <Field orientation="horizontal">
                  <Checkbox
                    id={`program-${program}`}
                    name="programs"
                    value={program}
                    defaultChecked={values.programs?.includes(program) ?? false}
                  />
                  <FieldContent>
                    <span className="text-sm font-medium">{PROGRAM_LABELS[program]}</span>
                  </FieldContent>
                </Field>
              </FieldLabel>
            ))}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact person</CardTitle>
          <CardDescription>Who we coordinate with at the school.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-5 md:grid-cols-3">
            <Field data-invalid={invalid("contactName")}>
              <FieldLabel htmlFor="contactName">Full name *</FieldLabel>
              <Input {...fieldProps("contactName")} autoComplete="name" />
              {error("contactName")}
            </Field>
            <Field data-invalid={invalid("contactEmail")}>
              <FieldLabel htmlFor="contactEmail">Email *</FieldLabel>
              <Input {...fieldProps("contactEmail")} type="email" autoComplete="email" />
              {error("contactEmail")}
            </Field>
            <Field data-invalid={invalid("contactPhone")}>
              <FieldLabel htmlFor="contactPhone">Phone *</FieldLabel>
              <Input {...fieldProps("contactPhone")} type="tel" autoComplete="tel" placeholder="98765 43210" />
              {error("contactPhone")}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>Where the school is located.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-5 md:grid-cols-3">
            <Field data-invalid={invalid("addressLine")} className="md:col-span-3">
              <FieldLabel htmlFor="addressLine">Street address *</FieldLabel>
              <Input {...fieldProps("addressLine")} autoComplete="street-address" />
              {error("addressLine")}
            </Field>
            <Field data-invalid={invalid("city")}>
              <FieldLabel htmlFor="city">City *</FieldLabel>
              <Input {...fieldProps("city")} autoComplete="address-level2" />
              {error("city")}
            </Field>
            <Field data-invalid={invalid("state")}>
              <FieldLabel htmlFor="state">State *</FieldLabel>
              <Select name="state" items={stateItems} defaultValue={values.state || null}>
                <SelectTrigger id="state" className="w-full" aria-invalid={invalid("state")}>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {stateItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error("state")}
            </Field>
            <Field data-invalid={invalid("pincode")}>
              <FieldLabel htmlFor="pincode">Pincode *</FieldLabel>
              <Input {...fieldProps("pincode")} inputMode="numeric" maxLength={6} autoComplete="postal-code" />
              {error("pincode")}
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Internal notes. Not visible to the school.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field data-invalid={invalid("notes")}>
            <Textarea {...fieldProps("notes")} rows={4} aria-label="Notes" />
            <FieldDescription>Up to 1000 characters.</FieldDescription>
            {error("notes")}
          </Field>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t">
          <Link
            href={school ? `/admin/schools/${school.id}` : "/admin/schools"}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Save />}
            {school ? "Save changes" : "Register school"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
