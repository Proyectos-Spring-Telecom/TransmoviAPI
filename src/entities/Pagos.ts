import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { applySchema } from 'src/common/apply-schema.decorator';

@applySchema
@Index('IX_Pagos_Monedero', ['monedero'])
@Index('IX_Pagos_ExternalReference', ['externalReference'])
@Index('UQ_Pagos_PaymentId', ['paymentId'], { unique: true })
@Index('UQ_Pagos_OrderId', ['orderId'], { unique: true })
@Entity('Pagos')
export class Pagos {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'Id' })
  id: number;

  @Column('varchar', { name: 'Monedero', length: 100 })
  monedero: string;

  @Column('decimal', { name: 'Monto', precision: 10, scale: 2 })
  monto: number;

  @Column('varchar', { name: 'TipoPago', length: 20, nullable: true })
  tipoPago: string | null;

  @Column('varchar', { name: 'ExternalReference', length: 150, nullable: true })
  externalReference: string | null;

  @Column('varchar', { name: 'EmailPayer', length: 150, nullable: true })
  emailPayer: string | null;

  @Column('varchar', { name: 'Descripcion', length: 255, nullable: true })
  descripcion: string | null;

  @Column('varchar', { name: 'UrlCheckout', length: 500, nullable: true })
  urlCheckout: string | null;

  @Column('varchar', { name: 'OrderId', length: 80, nullable: true })
  orderId: string | null;

  @Column('varchar', { name: 'PaymentId', length: 80, nullable: true })
  paymentId: string | null;

  @Column('varchar', { name: 'Status', length: 50, nullable: true })
  status: string | null;

  @Column('varchar', { name: 'PaymentStatus', length: 50, nullable: true })
  paymentStatus: string | null;

  @Column('varchar', { name: 'PaymentStatusDetail', length: 80, nullable: true })
  paymentStatusDetail: string | null;

  @Column('tinyint', { name: 'Estatus', default: () => "'0'" })
  estatus: number;

  @Column('datetime', {
    name: 'FechaCreacion',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaCreacion: Date;

  @Column('datetime', {
    name: 'FechaActualizacion',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaActualizacion: Date;
}
