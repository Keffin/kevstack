import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { Field } from "@/components/ui/Field.tsx";
import { trpc } from "@/lib/trpc.ts";

export function Greeting() {
  const [name, setName] = useState("");
  const deferredName = useDeferredValue(name.trim());

  const greeting = useQuery({
    ...trpc.hello.greet.queryOptions(deferredName ? { name: deferredName } : {}),
    placeholderData: keepPreviousData,
  });

  return (
    <section className="card stack">
      <h2>{greeting.data?.message ?? "…"}</h2>
      {greeting.error && <p className="error">{greeting.error.message}</p>}
      <Field
        label="Your name"
        name="name"
        value={name}
        maxLength={50}
        onChange={(event) => setName(event.target.value)}
      />
    </section>
  );
}
