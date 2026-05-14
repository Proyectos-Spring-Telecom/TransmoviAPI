# Contexto del proyecto — TransmoviAPI

## Qué es

API backend **NestJS 11** (`transmoviapi` v2.0.0) para operaciones Transmovi: conteo de pasajeros, viajes, transacciones, dashboard, mantenimiento, etc. Persistencia con **TypeORM** contra **MySQL** (consultas SQL en crudo donde el dominio lo exige).

## Stack relevante

- **Runtime:** Node.js, TypeScript.
- **Framework:** NestJS (módulos, guards, Swagger).
- **Auth:** JWT (`JwtAuthGuard`); el payload incluye al menos `userId`, `cliente`, `rol`.
- **Respuestas listas paginadas:** interfaz `ApiResponseCommon` (`data` + `paginated` opcional).

## Organización del código

- Cada dominio vive bajo `src/<modulo>/` con `*.module.ts`, `*.controller.ts`, `*.service.ts` y DTOs en `dto/`.
- Entidades TypeORM en `src/entities/`.
- Enumeraciones y tipos compartidos en `src/common/`.

## Módulo Conteo pasajeros (`conteopasajeros`)

### Resumen ascensos vs boletos por viaje

Implementado en `ConteopasajerosService.findResumenAscensosVsBoletosPorViaje` y expuesto en `GET /conteopasajeros/resumen-por-viaje/:fechaInicio/:fechaFin`.

**Objetivo de negocio:** por cada **Viaje**, comparar ascensos derivados de **ConteoPasajeros** con “boletos” como **COUNT** de filas en **HistoricoTransaccionesDebito** con `IdTipoTransaccion = DEBITO`, ligadas al viaje (`IdViajes`).

**Filtro de fechas (solo inclusión en la lista):**

- Un viaje **entra** en el resultado paginado si existe actividad en el rango:
  - algún `ConteoPasajeros.FechaHora`, o
  - algún `HistoricoTransaccionesDebito.FechaHoraFinal` (débito),
  - dentro de `[fechaInicio 00:00:00, fechaFin 23:59:59]`.
- **No** se filtra por `v.Inicio` / `v.Fin` del viaje para decidir inclusión.

**Totales y detalle (sin recorte por fecha):**

- `totalAscensos`: `SUM(Entradas - Salidas)` de **todo** el histórico de conteo del viaje (subconsulta por `IdViaje`), con reglas de cliente según rol.
- `totalBoletos`: `COUNT(*)` de débitos del viaje **sin** acotar por fecha en la subconsulta.
- `blueVoxs[].conteos`: detalle de conteos por serie para ese viaje, **sin** `BETWEEN` de fechas en la subconsulta anidada.

**Modelo SQL:** joins `Viajes` → `Turnos` → `Instalaciones` → `Vehiculos` → `InstalacionesBlueVoxs` (activos) → `BlueVoxs`; agregación `JSON_ARRAYAGG` + `GROUP BY` completo (`v.*` y columnas de vehículo necesarias para `ONLY_FULL_GROUP_BY`). Las variaciones por rol se arman con un objeto `pieces` (subconsultas y `WHERE`) y un único template de `sqlData` / `sqlCount`.

**Roles (cliente / jerarquía):**

| Rol | Comportamiento |
|-----|----------------|
| 1 | Sin filtro de cliente en ascensos/boletos/conteos/listado (salvo EXISTS de actividad en rango). |
| 2, 8, 10 | Jerarquía vía `clienteHijos` / `spGetClientes`: lista de IDs; filtros en `BlueVoxs`, `Dispositivos`, `Viajes` y EXISTS acordes. |
| 3 y demás | Cliente fijo del token (`cliente`). |

**Nota de inclusión:** al exigir `INNER JOIN` a instalación + BlueVox del turno, un viaje sin BlueVox vinculado en esa instalación **no** aparece aunque tenga conteos o débitos en rango.

## Mantenimiento de esta documentación

Cuando cambien reglas de negocio del resumen por viaje, el orden de parámetros SQL o el shape de respuesta, actualizar **este archivo** y **CONTRATO.md** en el mismo cambio.
