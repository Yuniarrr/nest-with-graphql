import { Field, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsBoolean } from 'class-validator';

@ObjectType()
export class LogoutResponse {
  @Field()
  @IsNotEmpty()
  @IsBoolean()
  logged_out: boolean;
}
