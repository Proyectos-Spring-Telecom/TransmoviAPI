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
import { CatTipoDescuentoTransbordo } from "./CatTipoDescuentoTransbordo";
import { Variantes } from "./Variantes";
import { applySchema } from "src/common/apply-schema.decorator";

@applySchema
@Index("FK_Transbordo_Cliente", ["idCliente"], {})
@Index("FK_Transbordo_TipoDescuento_idx", ["idTipoDescuento"], {})
@Index("FK_Transbordo_Variante", ["idVariante"], {})
@Entity("TransbordosPermitidos")
export class TransbordosPermitidos {
  @PrimaryGeneratedColumn({ type: "bigint", name: "Id" })
  id: number;

  @Column("bigint", { name: "IdCliente" })
  idCliente: number;

  @Column("bigint", { name: "IdTipoDescuento", nullable: true })
  idTipoDescuento: number | null;

  @Column("bigint", { name: "IdVariante" })
  idVariante: number;

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

  @ManyToOne(
    () => CatTipoDescuentoTransbordo,
    (tipoDescuento) => tipoDescuento.transbordosPermitidos,
    {
      onDelete: "NO ACTION",
      onUpdate: "NO ACTION",
    }
  )
  @JoinColumn([{ name: "IdTipoDescuento", referencedColumnName: "id" }])
  tipoDescuento: CatTipoDescuentoTransbordo | null;

  @ManyToOne(() => Variantes, (variantes) => variantes, {
    onDelete: "NO ACTION",
    onUpdate: "NO ACTION",
  })
  @JoinColumn([{ name: "IdVariante", referencedColumnName: "id" }])
  idVariante2: Variantes;

  @OneToMany(
    () => DetalleTransbordos,
    (detalleTransbordos) => detalleTransbordos.transbordoPermitido
  )
  detalleTransbordos: DetalleTransbordos[];
}

