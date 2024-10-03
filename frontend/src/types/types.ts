export type User = {
  un: string,
  fn: string,
  ln: string
}

export type DecordatedUser = {
  value: string,
  label: string,
  username: string,
  image: string,
}

export type Course = {
  id: number,
  idnumber: string,
  fullname: string,
}