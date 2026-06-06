import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('swaps')
export class Swap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  eventId: string;

  @Column({ nullable: true })
  tierId: string;

  @Column({ unique: true })
  swapId: string;

  @Column()
  fromChain: string;

  @Column()
  fromToken: string;

  @Column()
  fromAmount: string;

  @Column({ nullable: true })
  toAmount: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  txHash: string;

  @Column({ nullable: true })
  sourceTxHash: string;

  @Column({ nullable: true })
  depositAddress: string;

  @Column({ nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
