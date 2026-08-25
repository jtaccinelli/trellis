# Contract

A **contract** is a structured record of what one domain needs from another, including the required output shape and a verdict.

## Purpose

Contracts are how domain agents express cross-domain dependencies without talking directly to each other. The coordinator records contracts and creates child requirements for the provider domain.

## Contents

- **Consumer domain** — the domain that needs the output.
- **Provider domain** — the domain that will produce the output.
- **Required output shape** — interface, data format, behavior expected.
- **Verdict** — whether the contract is accepted, modified, or disputed.

## Lifecycle

- Created by a domain agent during assessment.
- Recorded by the coordinator on the scope requirement.
- The coordinator creates a new child requirement for the provider domain.
- Once built, the provider item’s `contract_summary` ratifies the contract.

## See also

- [Scope requirement](./requirement.md)
- [Item](./item.md)
- [Data model: entities](../60-data-model/entities.md)
- [Action: Cataloguing items](../35-actions/cataloguing-items.md)
