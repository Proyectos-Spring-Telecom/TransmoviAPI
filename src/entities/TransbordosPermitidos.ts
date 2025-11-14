import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Clientes } from "./Clientes";
import { DetalleTransbordos } from "./DetalleTransbordos";
import { applySchema } from "src/common/apply-schema.decorator";

@applySchema
@Index("FK_Transbordo_Cliente", ["idCliente"], {})
@Entity("TransbordosPermitidos")
export class TransbordosPermitidos {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Id" })
  id: number;

  @Column("bigint", { name: "IdCliente" })
  idCliente: number;

  @Column("varchar", { name: "Nombre", nullable: true, length: 100 })
  nombre: string | null;

  @Column("float", { name: "Tiempo", nullable: true })
  tiempo: number | null;

  @Column("int", { name: "NumeroTransbordos", nullable: true })
  numeroTransbordos: number | null;

  @ManyToOne(() => Clientes, (clientes) => clientes.transbordosPermitidos, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  @JoinColumn([{ name: "IdCliente", referencedColumnName: "id" }])
  idClienteTransbordo: Clientes;

  @OneToMany(
    () => DetalleTransbordos,
    (detalleTransbordos) => detalleTransbordos.transbordoPermitido
  )
  detalleTransbordos: DetalleTransbordos[];
}

