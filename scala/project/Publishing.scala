package im.dlg

import sbt._
import sbt.Keys._

object Publishing extends AutoPlugin {
  override def trigger = allRequirements

  override lazy val projectSettings = Seq(
    publishMavenStyle := true
  ) ++ settings()

  private def settings(): Seq[Def.Setting[_]] = {
    val publishSource = sys.env.get("PUBLISH_TO")
    val repoNameOpt = sys.env.get("NEXUS_REPOSITORY_NAME")
    val repoUrlOpt = sys.env.get("NEXUS_REPOSITORY_URL")

    val publishSettingOpt = for {
      pubTo <- publishSource if pubTo.toLowerCase == "nexus"
      repoName <- repoNameOpt
      repoUrl <- repoUrlOpt
    } yield repoName at repoUrl

    val envCredsOpt = for {
      username <- sys.env.get("NEXUS_USERNAME")
      password <- sys.env.get("NEXUS_PASSWORD")
      repoName <- repoNameOpt
      repoUrl <- repoUrlOpt
      _ = println(s"Got $username:$password credentials from env")
    } yield
      Seq(Credentials(repoName, new URL(repoUrl).getHost, username, password))

    val creds: Seq[Credentials] = envCredsOpt.getOrElse {
      println(s"Using credentials from `.credentials` files")
      Seq(
        Credentials(Path.userHome / ".m2" / ".credentials"),
        Credentials(Path.userHome / ".sbt" / ".credentials")
      )
    }

    Seq(
      credentials in ThisBuild ++= creds,
      publishTo in ThisBuild := publishSettingOpt
    )
  }
}
