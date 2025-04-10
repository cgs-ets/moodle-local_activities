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
  year?: string,
}

export type Course = {
  id: number,
  idnumber: string,
  fullname: string,
}

export type FileData = {
  index: number,
  displayname: string,
  file: File | null,
  progress: number,
  started: boolean,
  completed: boolean,
  removed: boolean,
  serverfilename: string,
  existing: boolean,
  key: string,
  fileid: string,
  path: string,
}




export type Parent =
  User & {
    response?: number,
  }
  
export type Student =
  User & {
    permission?: number,
    parents?: Parent[],
    year: string,
  }

export type Taglist = {
  id: number,
  name: string,
  students: Student[],
}

