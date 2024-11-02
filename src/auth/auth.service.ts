import * as bcrypt from 'bcrypt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create.dto';
import { User } from './auth.schema';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const user = await this.userModel.findOne({ email: createUserDto.email });
      if (!!user) {
        return 'E-mail já cadastrado';
      }

      const saltOrRounds = 10;

      const password = createUserDto.password
        ? await bcrypt.hash(createUserDto.password, saltOrRounds)
        : undefined;
      await this.userModel.create({ ...createUserDto, password });

      const newUser = await this.userModel.findOne({
        email: createUserDto.email,
      });

      const payload = {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      };

      const token = await this.jwtService.signAsync(payload);
      return {
        token,
        user: newUser,
      };
    } catch (error) {
      throw new Error();
    }
  }

  async auth(auth: LoginDto) {
    try {
      const user = await this.userModel.findOne({ email: auth.email });
      const isMatch =
        user && (await bcrypt.compare(auth.password, user?.password));

      if (!isMatch) {
        throw new UnauthorizedException('E-mail ou senha inválidos');
      }

      const payload = {
        id: user._id,
        name: user.name,
        email: user.email,
      };

      const token = await this.jwtService.signAsync(payload);

      return {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      console.log('error', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(error);
    }
  }
}
