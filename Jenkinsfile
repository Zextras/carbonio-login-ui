@Library("zextras-library@0.5.0") _

def nodeCmd(String cmd) {
	sh '. load_nvm && nvm install && nvm use && ' + cmd
}

def getCommitParentsCount() {
	return sh(script: '''
		COMMIT_ID=$(git log -1 --oneline | sed 's/ .*//')
		(git cat-file -p $COMMIT_ID | grep -w "parent" | wc -l)
	''', returnStdout: true).trim()
}

def getCommitVersion() {
	return sh(script: 'git log -1 | grep \'version:\' | sed -n \'s/version://p\' ', returnStdout: true).trim()
}

def getCurrentVersion() {
	return sh(script: 'grep \'"version":\' package.json | sed -n --regexp-extended \'s/.*"version": "([^"]+).*/\\1/p\' ', returnStdout: true).trim()
}

def getRepositoryName() {
	return sh(script: '''#!/bin/bash
			git remote -v | head -n1 | cut -d$'\t' -f2 | cut -d' ' -f1 | sed -e 's!https://bitbucket.org/!!g' -e 's!git@bitbucket.org:!!g' -e 's!.git!!g'
		''', returnStdout: true).trim()
}

def executeNpmLogin() {
	withCredentials([usernamePassword(credentialsId: 'npm-zextras-bot-auth', usernameVariable: 'AUTH_USERNAME', passwordVariable: 'AUTH_PASSWORD')]) {
		NPM_AUTH_TOKEN = sh(
				script: """
					curl -s \
						-H "Accept: application/json" \
						-H "Content-Type:application/json" \
						-X PUT --data \'{"name": "${AUTH_USERNAME}", "password": "${AUTH_PASSWORD}"}\' \
						http://registry.npmjs.com/-/user/org.couchdb.user:${AUTH_USERNAME} 2>&1 | grep -Po \
						\'(?<="token":")[^"]*\';
				""",
				returnStdout: true
		).trim()
		sh(
				script: """
				    touch .npmrc;
					echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > .npmrc
					""",
				returnStdout: true
		).trim()
	}
}

def calculateNextVersion() {
	def currentVersion = getCurrentVersion()
	def commitVersion = getCommitVersion()
	return sh(script: """#!/bin/bash
		   if [ x\"$commitVersion\" != x ]; then
			   echo \"$commitVersion\"
		   else
			   MICRO_VERSION=\$( echo $currentVersion | sed --regexp-extended 's/^.*\\.//' )
			   NEXT_MICRO_VERSION=\$(( \${MICRO_VERSION} + 1 ))
			   MAJOR_MINOR_VERSION=\$( echo $currentVersion | sed --regexp-extended 's/[0-9]+\$//' )
			   echo \"\${MAJOR_MINOR_VERSION}\${NEXT_MICRO_VERSION}\"
		   fi
	   """,
			returnStdout: true).trim()
}

pipeline {
	agent {
		node {
			label 'nodejs-agent-v2'
		}
	}
	options {
		timeout(time: 20, unit: 'MINUTES')
		buildDiscarder(logRotator(numToKeepStr: '50'))
	}
	environment {
		BUCKET_NAME = "zextras-artifacts"
		LOCAL_REGISTRY = "https://npm.zextras.com"
		COMMIT_PARENTS_COUNT = getCommitParentsCount()
		REPOSITORY_NAME = getRepositoryName()
	}
	stages {

//============================================ Release Automation ======================================================

		stage('Release automation') {
			when {
				beforeAgent true
				allOf {
					expression { BRANCH_NAME ==~ /(release|beta)/ }
					environment name: 'COMMIT_PARENTS_COUNT', value: '2'
				}
			}
			parallel {
				stage('Pull translations. Bump Version (Release)') {
					agent {
						node {
							label 'nodejs-agent-v2'
						}
					}
					when {
						beforeAgent true
						allOf {
							expression { BRANCH_NAME ==~ /(release)/ }
							environment name: 'COMMIT_PARENTS_COUNT', value: '2'
						}
					}
					steps {
						script {
							def nextVersion = calculateNextVersion()
							def tempBranchName = sh(script: """#!/bin/bash
									echo \"version-bumper/v$nextVersion\"\$( { [[ $BRANCH_NAME == 'beta' ]] && echo '-beta'; } || echo '' )
								""", returnStdout: true).trim()
							sh(script: """#!/bin/bash
								git config user.email \"bot@zextras.com\"
								git config user.name \"Tarsier Bot\"
								git remote set-url origin \$(git remote -v | head -n1 | cut -d\$'\t' -f2 | cut -d\" \" -f1 | sed 's!https://bitbucket.org/zextras!git@bitbucket.org:zextras!g')
								git subtree pull --squash --prefix translations/ git@bitbucket.org:zextras/com_zextras_iris_login.git master
								git add translations package.json
								sed --in-place --regexp-extended 's/\"version\": +\"[0-9]+\\.[0-9]+\\.[0-9]+\"/\"version\": \"$nextVersion\"/' package.json
								git commit -m \"Bumped version to $nextVersion\$( { [[ $BRANCH_NAME == 'beta' ]] && echo ' Beta'; } || echo '' )\"
								git tag -a v$nextVersion\$( { [[ $BRANCH_NAME == 'beta' ]] && echo '-beta'; } || echo '' ) -m \"Version $nextVersion\$( { [[ $BRANCH_NAME == 'beta' ]] && echo ' Beta'; } || echo '' )\"
								git push --tags
								git push origin HEAD:$BRANCH_NAME
								git push origin HEAD:refs/heads/$tempBranchName
							""")
							withCredentials([usernameColonPassword(credentialsId: 'tarsier-bot-pr-token', variable: 'PR_ACCESS')]) {
								sh(script: """
									curl https://api.bitbucket.org/2.0/repositories/$REPOSITORY_NAME/pullrequests \
									-u '$PR_ACCESS' \
									--request POST \
									--header 'Content-Type: application/json' \
									--data '{
											\"title\": \"Bumped version to $nextVersion into $BRANCH_NAME\",
											\"source\": {
												\"branch\": {
													\"name\": \"$tempBranchName\"
												}
											},
											\"destination\": {
												\"branch\": {
													\"name\": \"devel\"
												}
											},
											\"close_source_branch\": true
										}'
								""")
							}
						}
					}
				}
				stage('Push translations. Bump Version (Beta)') {
					agent {
						node {
							label 'nodejs-agent-v2'
						}
					}
					when {
						beforeAgent true
						allOf {
							expression { BRANCH_NAME ==~ /(beta)/ }
							environment name: 'COMMIT_PARENTS_COUNT', value: '2'
						}
					}
					steps {
						script {
							def nextVersion = calculateNextVersion()
							def tempBranchName = sh(script: """#!/bin/bash
									echo \"version-bumper/v$nextVersion\"\$( { [[ $BRANCH_NAME == 'beta' ]] && echo '-beta'; } || echo '' )
								""", returnStdout: true).trim()
							executeNpmLogin()
							nodeCmd 'npm install'
							nodeCmd 'NODE_ENV="production" npm run build'
							sh(script: """#!/bin/bash
								git config user.email \"bot@zextras.com\"
								git config user.name \"Tarsier Bot\"
								git remote set-url origin \$(git remote -v | head -n1 | cut -d\$'\t' -f2 | cut -d\" \" -f1 | sed 's!https://bitbucket.org/zextras!git@bitbucket.org:zextras!g')
								git add translations
								git commit -m \"Extracted translations\"
								sed --in-place --regexp-extended 's/\"version\": +\"[0-9]+\\.[0-9]+\\.[0-9]+\"/\"version\": \"$nextVersion\"/' package.json
								git add package.json
								git commit -m \"Bumped version to $nextVersion\$( { [[ $BRANCH_NAME == 'beta' ]] && echo ' Beta'; } || echo '' )\"
								git tag -a v$nextVersion\$( { [[ $BRANCH_NAME == 'beta' ]] && echo '-beta'; } || echo '' ) -m \"Version $nextVersion\$( { [[ $BRANCH_NAME == 'beta' ]] && echo ' Beta'; } || echo '' )\"
								git push --tags
								git push origin HEAD:$BRANCH_NAME
								git push origin HEAD:refs/heads/$tempBranchName
								git subtree push --prefix translations/ git@bitbucket.org:zextras/com_zextras_iris_login.git master
							""")
							withCredentials([usernameColonPassword(credentialsId: 'tarsier-bot-pr-token', variable: 'PR_ACCESS')]) {
								sh(script: """
									curl https://api.bitbucket.org/2.0/repositories/$REPOSITORY_NAME/pullrequests \
									-u '$PR_ACCESS' \
									--request POST \
									--header 'Content-Type: application/json' \
									--data '{
											\"title\": \"Bumped version to $nextVersion into $BRANCH_NAME\",
											\"source\": {
												\"branch\": {
													\"name\": \"$tempBranchName\"
												}
											},
											\"destination\": {
												\"branch\": {
													\"name\": \"devel\"
												}
											},
											\"close_source_branch\": true
										}'
								""")
							}
						}
					}
				}
			}
		}

//============================================ Tests ===================================================================

		stage('Tests') {
			when {
				beforeAgent true
				allOf{
					expression { BRANCH_NAME ==~ /PR-\d+/ }
				}
			}
			parallel {
// 				stage('Type Checking') {
// 					agent {
// 						node {
// 							label 'nodejs-agent-v2'
// 						}
// 					}
// 					steps {
// 						executeNpmLogin()
// 						nodeCmd 'npm install'
// 						nodeCmd 'npm run type-check'
// 					}
// 				}
				stage('Linting') {
                    agent {
                        node {
                            label 'nodejs-agent-v2'
                        }
                    }
                    steps {
                        executeNpmLogin()
						nodeCmd 'npm install'
						nodeCmd 'npm run lint'
                    }
                }
			}
		}

//============================================ Build ===================================================================

		stage('Build') {
			parallel {
				stage('Build package') {
					agent {
						node {
							label 'nodejs-agent-v2'
						}
					}
					when {
						beforeAgent true
						not {
							allOf {
								expression { BRANCH_NAME ==~ /(release|beta)/ }
								environment name: 'COMMIT_PARENTS_COUNT', value: '2'
							}
						}
					}
					steps {
						executeNpmLogin()
						nodeCmd 'npm install'
						nodeCmd 'NODE_ENV="production" npm run build'
						sh 'mkdir -p pkg && cd build && zip -r ../pkg/zextras-login-page.zip .'
						stash includes: 'pkg/zextras-login-page.zip', name: 'package_unsigned'
					}
				}
 				stage('Build documentation') {
 					agent {
 						node {
 							label 'nodejs-agent-v2'
 						}
 					}
 					when {
 						beforeAgent true
 						allOf {
 							expression { BRANCH_NAME ==~ /(release|beta)/ }
 							environment name: 'COMMIT_PARENTS_COUNT', value: '1'
 						}
 					}
 					steps {
 						script {
 							nodeCmd 'cd docs/website && npm install'
 							nodeCmd 'cd docs/website && BRANCH_NAME=${BRANCH_NAME} npm run build'
 							stash includes: 'docs/website/build/com_zextras_zapp_login/', name: 'doc'
 						}
 					}
 				}
			}
		}

 		stage('Sign Package') {
 			agent {
 				node {
 					label 'nodejs-agent-v2'
 				}
 			}
 			when {
 				beforeAgent true
 				not {
 					allOf {
 						expression { BRANCH_NAME ==~ /(release|beta)/ }
 						environment name: 'COMMIT_PARENTS_COUNT', value: '2'
 					}
 				}
 			}
 			steps {
 				dir('artifact-deployer') {
 					git branch: 'master',
 							credentialsId: 'tarsier_bot-ssh-key',
 							url: 'git@bitbucket.org:zextras/artifact-deployer.git'
 					unstash "package_unsigned"
 					sh './sign-zextras-zip pkg/zextras-login-page.zip'
 					stash includes: 'pkg/zextras-login-page.zip', name: 'package'
 					archiveArtifacts artifacts: 'pkg/zextras-login-page.zip', fingerprint: true
				}
 			}
 		}

 		stage('Deploy') {
 			parallel {
 				stage('Deploy documentation') {
 					agent {
 						node {
 							label 'nodejs-agent-v2'
 						}
 					}
 					when {
 						beforeAgent true
 						allOf {
 							expression { BRANCH_NAME ==~ /(release|beta)/ }
 							environment name: 'COMMIT_PARENTS_COUNT', value: '1'
 						}
 					}
 					steps {
 						script {
 							unstash 'doc'
 							doc.rm file: "iris/zapp-login/${BRANCH_NAME}"
 							doc.mkdir folder: "iris/zapp-login/${BRANCH_NAME}"
 							doc.upload file: "docs/website/build/com_zextras_zapp_login/**", destination: "iris/zapp-login/${BRANCH_NAME}"
 						}
 					}
 				}
// 				stage('Deploy Beta on demo server') {
// 					agent {
// 						node {
// 							label 'nodejs-agent-v2'
// 						}
// 					}
// 					when {
// 						beforeAgent true
// 						allOf {
// 							expression { BRANCH_NAME ==~ /(beta)/ }
// 							environment name: 'COMMIT_PARENTS_COUNT', value: '1'
// 						}
// 					}
// 					steps {
// 						script {
// 							unstash 'zimlet_package'
// 							sh 'unzip pkg/com_zextras_zapp_mails.zip -d deploy'
// 							iris.rm file: 'com_zextras_zapp_mails/*'
// 							// iris.mkdir folder: 'com_zextras_zapp_mails'
// 							iris.upload file: 'deploy/*', destination: 'com_zextras_zapp_mails/'
// 						}
// 					}
// 				}
 			}
 		}
	}
}
