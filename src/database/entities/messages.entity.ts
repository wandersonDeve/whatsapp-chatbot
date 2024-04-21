import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('message')
class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly uuid: string;

  @Column({ nullable: true })
  file_url: string;

  @Column({ nullable: false })
  version: string;

  @Column({ nullable: false })
  book: string;

  @Column({ nullable: false, type: 'int' })
  chapter: number;

  @Column({ nullable: false, type: 'int' })
  verse: number;

  @Column()
  publication_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

export { MessageEntity };
