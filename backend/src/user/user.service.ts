import { compare } from 'bcrypt';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { sign } from 'jsonwebtoken';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ArchiveUserOption } from './types/archive-user-option.type';
import { UserResponseInterface } from './types/user-response';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      throw new HttpException(
        'Email or username are taken',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // alternative
    // const newUser = new UserEntity();
    // Object.assign(newUser, createUserDto);
    const newUser = this.userRepository.create(createUserDto);

    return await this.userRepository.save(newUser);
  }

  async updatetUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    // Load user with password field (needed to avoid re-hashing)
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'username', 'email', 'role', 'image', 'password'],
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (updateUserDto.username) user.username = updateUserDto.username;
    if (updateUserDto.email) user.email = updateUserDto.email;
    if (updateUserDto.image !== undefined) user.image = updateUserDto.image;
    if (updateUserDto.role) user.role = updateUserDto.role;

    // Only update password if provided
    if (updateUserDto.password) {
      user.password = updateUserDto.password;
    }

    return await this.userRepository.save(user);
  }

  async login(loginUserDto: LoginUserDto): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOne({
      where: { email: loginUserDto.email },
      select: ['id', 'email', 'image', 'password', 'role', 'username'],
    });

    if (!existingUser) {
      throw new HttpException(
        'Credentials are not valid',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const isPasswordCorrect = await compare(
      loginUserDto.password,
      existingUser.password,
    );

    if (!isPasswordCorrect) {
      throw new HttpException(
        'Credentials are not valid',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const userResponse: Partial<UserEntity> = { ...existingUser };
    delete userResponse.password;

    return userResponse as UserEntity;
  }

  findById(id: number): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  findArchiveOptions(): Promise<ArchiveUserOption[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'image'],
      order: { username: 'ASC' },
    });
  }

  generateJwt(user: UserEntity): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
    ) as string;
  }

  buildUserResponse(user: UserEntity): UserResponseInterface {
    return {
      user: {
        ...user,
        token: this.generateJwt(user),
      },
    };
  }
}
