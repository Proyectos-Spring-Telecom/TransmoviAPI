import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Roles } from "./Roles";
import { Clientes } from "./Clientes";

@Index("UserName_IdCliente", ["IdCliente", "UserName"], { unique: true })
@Index("IdRol", ["IdRol"], {})
@Index("IdCliente", ["IdCliente"], {})
@Entity("Usuarios", { schema: "TransmoviDev" })
export class Usuarios {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Id" })
  Id: number;

  @Column("varchar", { name: "UserName", length: 255 })
  UserName: string;

  @Column("varchar", { name: "PasswordHash", length: 255 })
  PasswordHash: string;

  @Column("varchar", { name: "PinHash", nullable: true, length: 6 })
  PinHash: string | null;

  @Column("tinyint", {
    name: "EmailConfirmado",
    default: () => "'0'",
  })
  EmailConfirmado: number;

  @Column("varchar", { name: "Nombre", nullable: true, length: 100 })
  Nombre: string | null;

  @Column("varchar", { name: "ApellidoPaterno", nullable: true, length: 100 })
  ApellidoPaterno: string | null;

  @Column("varchar", { name: "ApellidoMaterno", nullable: true, length: 100 })
  ApellidoMaterno: string | null;

  @Column("varchar", { name: "Telefono", nullable: true, length: 20 })
  Telefono: string | null;

  @Column("datetime", { name: "UltimoLogin", nullable: true })
  UltimoLogin: Date | null;

  @Column("datetime", { name: "ActualizacionPassword", nullable: true })
  ActualizacionPassword: Date | null;

  @Column("datetime", { name: "ActualizacionPin", nullable: true })
  ActualizacionPin: Date | null;

  @Column("varchar", { name: "DispositivoId", nullable: true, length: 15 })
  DispositivoId: string | null;

  @Column("datetime", {
    name: "FechaCreacion",
    default: () => "CURRENT_TIMESTAMP",
  })
  FechaCreacion: Date;

  @Column("datetime", {
    name: "FechaActualizacion",
    default: () => "CURRENT_TIMESTAMP",
    onUpdate: "CURRENT_TIMESTAMP",
  })
  FechaActualizacion: Date;

  @Column("tinyint", { name: "Estatus", default: () => "'1'" })
  Estatus: number;

  @Column("bigint", { name: "IdRol" })
  IdRol: number;

  @Column("bigint", { name: "IdCliente" })
  IdCliente: number;

  @ManyToOne(() => Roles, (roles) => roles.usuarios, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "IdRol", referencedColumnName: "Id" }])
  IdRol2: Roles;

  @ManyToOne(() => Clientes, (clientes) => clientes.usuarios, {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "IdCliente", referencedColumnName: "Id" }])
  IdCliente2: Clientes;
}
