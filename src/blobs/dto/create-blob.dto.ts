import { IsString, IsNotEmpty, IsBase64, MaxLength, IsByteLength } from 'class-validator';


export class CreateBlobDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  @IsByteLength(1, 10 * 1024 * 1024 ) // 10MB limit
  data: string;
}
